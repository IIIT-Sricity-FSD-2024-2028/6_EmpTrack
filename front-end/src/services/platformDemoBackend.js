// DEMO MODE ONLY - an in-browser stand-in for the NestJS platform services.
//
// Used by platformAdminService.js and supportMemberService.js while VITE_API_URL
// is empty. It ports the rules of the real services so the portals behave the
// same with or without a backend:
//   back-end/src/platform-ticket/platform-ticket.service.ts   (ticket workflow)
//   back-end/src/platform-team/platform-team.service.ts       (teams, workload)
//   back-end/src/platform-dashboard/platform-dashboard.service.ts
//   back-end/src/company/company.service.ts                   (companies, Company Admins)
//   back-end/src/payment/payment.service.ts                   (Platform Admin payments)
//   back-end/src/support-member/support-member.service.ts
// Data lives in localStorage (DEMO_KEY) and is shared by both portals, so a
// Support Member's escalation shows up for the Platform Admin in the same browser.
// Nothing here reaches a server.
import { STORAGE_KEYS } from '../utils/constants';
import { readStorage, writeStorage } from '../utils/helpers';
import { createDemoData, normalizeTicket } from './platformDemo';

const DEMO_KEY = 'empTrack_platform_demo_v1'; // bump when the seed shape changes

const VALID_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER', 'ESCALATED', 'RESOLVED', 'CLOSED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const OPEN_STATUSES = ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CUSTOMER'];

const today = () => new Date().toISOString().split('T')[0];
const now = () => new Date().toISOString();

class DemoError extends Error {}
const fail = (message) => {
  throw new DemoError(message);
};

// ---- storage ----
function load() {
  let data = readStorage(DEMO_KEY);
  if (!data?.tickets) {
    data = createDemoData();
    writeStorage(DEMO_KEY, data);
  }
  return data;
}

function write(mutate) {
  const data = load();
  const result = mutate(data);
  writeStorage(DEMO_KEY, data);
  return result;
}

/** The logged-in user, from the persisted session (same source as api.js headers). */
export function sessionActor() {
  const user = readStorage(STORAGE_KEYS.AUTH)?.user || {};
  return { emp_id: user.emp_id || '', emp_name: user.emp_name || '', role: user.role || '' };
}

// ---- shared helpers ----
function logActivity(data, actor, entry) {
  data.activityLogs.push({
    activity_id: `ACT-${Date.now()}`,
    user_id: actor.emp_id,
    user_name: actor.emp_name,
    role: actor.role,
    timestamp: now(),
    ...entry,
  });
}

function notify(data, employeeId, message, type = 'info', link) {
  data.notifications.push({ id: `N-${Date.now()}-${data.notifications.length}`, employee_id: employeeId, message, type, link, timestamp: now() });
}

function enrichTicket(data, ticket) {
  const company = data.companies.find((c) => c.company_id === ticket.company_id);
  const assignee = data.employees.find((e) => e.emp_id === ticket.assigned_to);
  return { ...ticket, company_name: company ? company.company_name : ticket.company_id, assigned_to_name: assignee ? assignee.emp_name : null };
}

function findTicket(data, type, id, scope) {
  const ticket = data.tickets.find((t) => t.ticket_id === id && t.ticket_type === type);
  if (!ticket || (scope && ticket.platform_admin_id !== scope)) fail('Ticket not found');
  return ticket;
}

function touch(ticket) {
  ticket.updated_date = today();
}

// ---- scopes ----
/** Platform Admin requests are always scoped to the caller (resolvePlatformAdminScope). */
function platformScope() {
  return sessionActor().emp_id;
}

/**
 * Support Member scope = their Platform Admin. The mock-login demo account is not
 * part of the seed, so on first use it is registered as a Support Member of PA001
 * (demo data only), mirroring how a Platform Admin adds a team member.
 */
function supportScope() {
  const actor = sessionActor();
  return write((data) => {
    let member = data.employees.find((e) => e.emp_id === actor.emp_id && e.role === 'SUPPORT_MEMBER');
    if (!member) {
      member = {
        emp_id: actor.emp_id, emp_name: actor.emp_name, email: readStorage(STORAGE_KEYS.AUTH)?.user?.email || '',
        phone: '', role: 'SUPPORT_MEMBER', status: 'ACTIVE', date_of_joining: today(), companyId: null,
        platform_admin_id: 'PA001', specialization: 'General Support',
      };
      data.employees.push(member);
    }
    return member.platform_admin_id || null;
  });
}

// ---- tickets (platform-ticket.service.ts) ----
function listTickets(type, scope, f = {}) {
  const data = load();
  let list = data.tickets.filter((t) => t.ticket_type === type);
  if (scope) list = list.filter((t) => t.platform_admin_id === scope);
  if (f.status && f.status !== 'all') list = list.filter((t) => t.status === f.status);
  if (f.priority && f.priority !== 'all') list = list.filter((t) => t.priority === f.priority);
  if (f.companyId && f.companyId !== 'all') list = list.filter((t) => t.company_id === f.companyId);
  if (f.assignedTo === 'unassigned') list = list.filter((t) => !t.assigned_to);
  else if (f.assignedTo) list = list.filter((t) => t.assigned_to === f.assignedTo);
  if (f.category && f.category !== 'all') list = list.filter((t) => t.category === f.category);
  if (f.escalatedOnly) list = list.filter((t) => t.status === 'ESCALATED');
  let enriched = list.map((t) => enrichTicket(data, t));
  if (f.search) {
    const q = f.search.toLowerCase();
    enriched = enriched.filter((t) =>
      [t.ticket_id, t.company_name, t.title, t.raised_by_name, t.raised_by_email].some((v) => (v || '').toLowerCase().includes(q)));
  }
  return enriched.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
}

function getTicket(type, id, scope) {
  const data = load();
  return enrichTicket(data, findTicket(data, type, id, scope));
}

function mutateTicket(type, id, scope, fn) {
  return write((data) => {
    const ticket = findTicket(data, type, id, scope);
    fn(ticket, data);
    return enrichTicket(data, ticket);
  });
}

const typeLabel = (type) => (type === 'TECHNICAL' ? 'Technical issue' : 'Support ticket');

function notifyAssignee(data, ticket, assignedTo) {
  notify(data, assignedTo, `${typeLabel(ticket.ticket_type)} ${ticket.ticket_id} (${ticket.title}) has been assigned to you.`);
}

function assign(type, id, assignedTo) {
  const actor = sessionActor();
  return mutateTicket(type, id, platformScope(), (t, data) => {
    t.assigned_to = assignedTo;
    if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
    touch(t);
    logActivity(data, actor, { action: `${typeLabel(type)} assigned`, company_id: t.company_id, details: `${t.ticket_id} assigned.` });
    notifyAssignee(data, t, assignedTo);
  });
}

function reassign(type, id, assignedTo, reason) {
  const actor = sessionActor();
  return mutateTicket(type, id, platformScope(), (t, data) => {
    t.reassign_log.push({ from: t.assigned_to, to: assignedTo, reason, date: today() });
    t.assigned_to = assignedTo;
    if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
    touch(t);
    logActivity(data, actor, { action: `${typeLabel(type)} reassigned`, company_id: t.company_id, details: `${t.ticket_id} reassigned: ${reason}` });
    notifyAssignee(data, t, assignedTo);
  });
}

function addComment(type, id, message, scope) {
  const actor = sessionActor();
  return mutateTicket(type, id, scope, (t, data) => {
    t.comments.push({ author: actor.emp_name, message, timestamp: now() });
    touch(t);
    if (t.assigned_to && t.assigned_to !== actor.emp_id) {
      notify(data, t.assigned_to, `${actor.emp_name} replied on ${t.ticket_id} (${t.title}).`);
    }
  });
}

function resolve(type, id, notes, scope) {
  const actor = sessionActor();
  return mutateTicket(type, id, scope, (t, data) => {
    if (['RESOLVED', 'CLOSED'].includes(t.status)) fail('This ticket is already resolved or closed.');
    t.status = 'RESOLVED';
    t.resolved_date = today();
    if (notes) t.comments.push({ author: actor.emp_name, message: notes, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: `${typeLabel(type)} resolved`, company_id: t.company_id, details: `${t.ticket_id} marked as resolved.` });
  });
}

/** Platform Admin -> Super Admin: opens a critical escalation (critical-escalation.service). */
function escalateToSuperAdmin(type, id, note) {
  const actor = sessionActor();
  return mutateTicket(type, id, platformScope(), (t, data) => {
    const escalationId = `CESC-${Date.now()}`;
    data.criticalEscalations.push({ issue_id: escalationId, company_id: t.company_id, raised_by: actor.emp_id, status: 'OPEN' });
    logActivity(data, actor, { action: 'Critical escalation raised', company_id: t.company_id, details: `Escalated from ${t.ticket_id}: ${t.title}.${note ? ` ${note}` : ''}` });
    t.status = 'ESCALATED';
    t.linked_escalation_id = escalationId;
    if (note) t.comments.push({ author: actor.emp_name, message: note, timestamp: now() });
    touch(t);
  });
}

function verifyResolution(id, note) {
  const actor = sessionActor();
  return mutateTicket('TECHNICAL', id, platformScope(), (t, data) => {
    if (t.verification_status !== 'PENDING_VERIFICATION') fail('This issue is not awaiting verification.');
    Object.assign(t, { verification_status: 'VERIFIED', verification_note: note || null, verified_by: actor.emp_id, verified_by_name: actor.emp_name, verified_at: now(), status: 'CLOSED' });
    if (note) t.comments.push({ author: actor.emp_name, message: note, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: 'Technical issue verified', company_id: t.company_id, details: `${t.ticket_id} verified and closed.` });
    if (t.assigned_to) notify(data, t.assigned_to, `${actor.emp_name} verified your resolution of ${t.ticket_id} (${t.title}). The issue is now closed.`);
  });
}

function rejectResolution(id, reason) {
  const actor = sessionActor();
  return mutateTicket('TECHNICAL', id, platformScope(), (t, data) => {
    if (t.verification_status !== 'PENDING_VERIFICATION') fail('This issue is not awaiting verification.');
    Object.assign(t, { verification_status: 'REJECTED', verification_note: reason, verified_by: actor.emp_id, verified_by_name: actor.emp_name, verified_at: now(), status: 'IN_PROGRESS', resolved_date: null });
    t.comments.push({ author: actor.emp_name, message: `Verification rejected: ${reason}`, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: 'Technical issue verification rejected', company_id: t.company_id, details: `${t.ticket_id} returned for rework: ${reason}` });
    if (t.assigned_to) notify(data, t.assigned_to, `${actor.emp_name} returned ${t.ticket_id} (${t.title}) for rework: ${reason}`, 'warning');
  });
}

// ---- Support Member ticket actions ----
function smMutate(id, fn) {
  return mutateTicket('SUPPORT', id, supportScope(), fn);
}

function claim(id) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    if (t.assigned_to) fail('Ticket has already been claimed by another Support Member.');
    t.assigned_to = actor.emp_id;
    if (t.status === 'OPEN') t.status = 'IN_PROGRESS';
    touch(t);
    logActivity(data, actor, { action: 'Ticket claimed', company_id: t.company_id, details: `${t.ticket_id} claimed by ${actor.emp_name}.` });
  });
}

function changeStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) fail(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    const previous = t.status;
    t.status = status;
    if (status === 'RESOLVED') t.resolved_date = today();
    else if (OPEN_STATUSES.includes(status) && ['RESOLVED', 'CLOSED'].includes(previous)) t.resolved_date = null;
    touch(t);
    logActivity(data, actor, { action: 'Ticket status changed', company_id: t.company_id, details: `${t.ticket_id} status changed from ${previous} to ${status}.` });
  });
}

function changePriority(id, priorityInput) {
  const priority = (priorityInput || '').toUpperCase();
  if (!VALID_PRIORITIES.includes(priority)) fail(`Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`);
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    const previous = t.priority;
    t.priority = priority.charAt(0) + priority.slice(1).toLowerCase();
    touch(t);
    logActivity(data, actor, { action: 'Ticket priority changed', company_id: t.company_id, details: `${t.ticket_id} priority changed from ${previous} to ${t.priority}.` });
  });
}

function changeCategory(id, category) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    const previous = t.category;
    t.category = category;
    touch(t);
    logActivity(data, actor, { action: 'Ticket category changed', company_id: t.company_id, details: `${t.ticket_id} category changed from ${previous} to ${category}.` });
  });
}

function reopen(id, reason) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    if (!['RESOLVED', 'CLOSED'].includes(t.status)) fail('Only resolved or closed tickets can be reopened.');
    t.status = 'IN_PROGRESS';
    t.resolved_date = null;
    if (reason) t.comments.push({ author: actor.emp_name, message: `Reopened: ${reason}`, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: 'Ticket reopened', company_id: t.company_id, details: `${t.ticket_id} reopened.${reason ? ` Reason: ${reason}` : ''}` });
  });
}

function close(id) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    if (t.status !== 'RESOLVED') fail('Only resolved tickets can be closed.');
    t.status = 'CLOSED';
    touch(t);
    logActivity(data, actor, { action: 'Ticket closed', company_id: t.company_id, details: `${t.ticket_id} closed.` });
  });
}

function addInternalNote(id, message) {
  const actor = sessionActor();
  return smMutate(id, (t) => {
    t.internal_notes.push({ author: actor.emp_name, message, timestamp: now() });
    touch(t);
  });
}

function escalateToTechnical(id, note) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    if (t.status === 'ESCALATED') fail('This ticket has already been escalated.');
    const technical = normalizeTicket({
      ticket_id: `TIX-${Date.now()}`,
      ticket_type: 'TECHNICAL',
      company_id: t.company_id,
      platform_admin_id: t.platform_admin_id,
      raised_by_name: t.raised_by_name,
      raised_by_id: t.raised_by_id || null,
      raised_by_email: t.raised_by_email || null,
      title: `Escalated from ${t.ticket_id}: ${t.title}`,
      category: 'Technical Issue',
      priority: t.priority,
      status: 'OPEN',
      assigned_to: null,
      description: `${t.description}${note ? `\n\nSupport Member note: ${note}` : ''}`,
      created_date: today(),
      updated_date: today(),
      linked_from_ticket_id: t.ticket_id,
    });
    data.tickets.push(technical);
    t.status = 'ESCALATED';
    t.escalated_team = 'TECHNICAL';
    t.linked_technical_ticket_id = technical.ticket_id;
    t.internal_notes.push({ author: actor.emp_name, message: `Escalated to Technical Team as ${technical.ticket_id}.${note ? ` ${note}` : ''}`, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: 'Support ticket escalated to Technical Team', company_id: t.company_id, details: `${t.ticket_id} escalated as ${technical.ticket_id}.` });
    if (t.platform_admin_id) {
      notify(data, t.platform_admin_id, `Support ticket ${t.ticket_id} was escalated to the Technical Team as ${technical.ticket_id}.`, 'warning');
    }
  });
}

function escalateToPlatformAdmin(id, note) {
  const actor = sessionActor();
  return smMutate(id, (t, data) => {
    if (t.status === 'ESCALATED') fail('This ticket has already been escalated.');
    t.status = 'ESCALATED';
    t.escalated_team = 'PLATFORM_ADMIN';
    t.internal_notes.push({ author: actor.emp_name, message: `Escalated to Platform Admin.${note ? ` ${note}` : ''}`, timestamp: now() });
    touch(t);
    logActivity(data, actor, { action: 'Support ticket escalated to Platform Admin', company_id: t.company_id, details: `${t.ticket_id}: ${t.title}.${note ? ` ${note}` : ''}` });
    if (t.platform_admin_id) {
      notify(data, t.platform_admin_id, `${actor.emp_name} escalated support ticket ${t.ticket_id} (${t.title}) to you.${note ? ` ${note}` : ''}`, 'warning');
    }
  });
}

function supportStats() {
  const scope = supportScope();
  const actorId = sessionActor().emp_id;
  const tickets = load().tickets.filter((t) => t.ticket_type === 'SUPPORT' && (!scope || t.platform_admin_id === scope));
  const mine = tickets.filter((t) => t.assigned_to === actorId);
  const resolved = tickets.filter((t) => t.resolved_date);
  const avg = resolved.length
    ? Math.round((resolved.reduce((sum, t) => sum + (new Date(t.resolved_date) - new Date(t.created_date)), 0) / resolved.length / (1000 * 60 * 60 * 24)) * 10) / 10
    : 0;
  const byPriority = {};
  const byCategory = {};
  tickets.forEach((t) => {
    byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    byCategory[t.category] = (byCategory[t.category] || 0) + 1;
  });
  const isClosed = (t) => t.status === 'RESOLVED' || t.status === 'CLOSED';
  return {
    unassigned_tickets: tickets.filter((t) => !t.assigned_to).length,
    critical_tickets: tickets.filter((t) => t.priority === 'Critical' && !isClosed(t)).length,
    my_open_tickets: mine.filter((t) => OPEN_STATUSES.includes(t.status)).length,
    escalated_tickets: tickets.filter((t) => t.status === 'ESCALATED').length,
    resolved_today: mine.filter((t) => t.resolved_date === today()).length,
    tickets_received: tickets.length,
    tickets_resolved: tickets.filter(isClosed).length,
    avg_resolution_days: avg,
    by_priority: byPriority,
    by_category: byCategory,
    my_escalated: mine.filter((t) => t.status === 'ESCALATED').length,
    my_resolved: mine.filter(isClosed).length,
  };
}

// ---- teams (platform-team.service.ts) ----
function enrichMember(data, m) {
  const tickets = data.tickets.filter((t) => t.assigned_to === m.emp_id);
  return {
    ...m,
    open_tickets: tickets.filter((t) => t.status === 'OPEN').length,
    in_progress_tickets: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    total_assigned: tickets.length,
  };
}

function teamList(role, { status, search } = {}) {
  const data = load();
  const scope = platformScope();
  let members = data.employees.filter((e) => e.role === role && e.platform_admin_id === scope);
  if (status && status !== 'all') members = members.filter((m) => m.status === status);
  if (search) {
    const q = search.toLowerCase();
    members = members.filter((m) => m.emp_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }
  return members.map((m) => enrichMember(data, m));
}

function findMember(data, role, id) {
  const m = data.employees.find((e) => e.emp_id === id && e.role === role);
  if (!m || m.platform_admin_id !== platformScope()) fail('Team member not found');
  return m;
}

const teamLabel = (role) => (role === 'TECHNICAL_MEMBER' ? 'Technical' : 'Support');

function teamCreate(role, dto) {
  const actor = sessionActor();
  return write((data) => {
    if (data.employees.some((e) => e.email === dto.email)) fail('An account with this email already exists');
    const m = {
      emp_id: (role === 'TECHNICAL_MEMBER' ? 'TT-' : 'ST-') + Date.now(),
      emp_name: dto.name, email: dto.email, phone: dto.phone, role, status: 'ACTIVE',
      date_of_joining: today(), companyId: null, platform_admin_id: actor.emp_id, specialization: dto.specialization || null,
    };
    data.employees.push(m);
    logActivity(data, actor, { action: `${teamLabel(role)} Member added`, details: `Added ${dto.name} to the ${teamLabel(role)} team.` });
    return enrichMember(data, m);
  });
}

function teamUpdate(role, id, dto) {
  return write((data) => {
    const m = findMember(data, role, id);
    // UpdateTeamMemberDto sends `name`; the real service copies DTO keys onto the
    // record as-is (so `name` never reaches `emp_name` there). The demo maps it.
    const { name, ...rest } = dto;
    if (name !== undefined) m.emp_name = name;
    Object.keys(rest).forEach((k) => {
      if (rest[k] !== undefined) m[k] = rest[k];
    });
    return enrichMember(data, m);
  });
}

function teamUpdateStatus(role, id, status) {
  const actor = sessionActor();
  return write((data) => {
    const m = findMember(data, role, id);
    if (status !== 'ACTIVE' && data.tickets.some((t) => t.assigned_to === id && (t.status === 'OPEN' || t.status === 'IN_PROGRESS'))) {
      fail("Reassign this team member's open tickets before deactivating their account");
    }
    m.status = status;
    logActivity(data, actor, { action: status === 'ACTIVE' ? 'Team member activated' : 'Team member deactivated', details: `${m.emp_name}'s account status changed to ${status}.` });
    return enrichMember(data, m);
  });
}

// ---- companies / payments / dashboard ----
function enrichCompany(data, c) {
  const plan = data.plans.find((p) => p.plan_id === c.subscription_plan_id);
  const admin = data.employees.find((e) => e.companyId === c.company_id && e.role === 'COMPANY_ADMIN');
  return {
    ...c,
    subscription_plan_name: plan ? plan.name : null,
    company_admin_name: admin ? admin.emp_name : null,
    company_admin_email: admin ? admin.email : null,
    company_admin_status: admin ? admin.status : null,
    employee_count: data.employeeCounts[c.company_id] || 0,
  };
}

function companies() {
  const data = load();
  const scope = platformScope();
  return data.companies.filter((c) => c.platform_admin_id === scope).map((c) => enrichCompany(data, c));
}

function createCompanyAdmin(companyId, dto) {
  const actor = sessionActor();
  return write((data) => {
    const company = data.companies.find((c) => c.company_id === companyId);
    if (!company) fail('Company not found');
    if (company.platform_admin_id !== actor.emp_id) fail('You can only manage Company Admins for companies assigned to you');
    if (dto.password !== dto.confirmPassword) fail('Password and confirmation do not match');
    if (data.employees.some((e) => e.email === dto.email)) fail('An account with this email already exists');
    // The password is validated but never stored: demo accounts cannot log in.
    const admin = {
      emp_id: `CA-${Date.now()}`, emp_name: dto.name, email: dto.email, phone: dto.phone, role: 'COMPANY_ADMIN',
      status: dto.status || 'ACTIVE', date_of_joining: today(), companyId,
    };
    data.employees.push(admin);
    logActivity(data, actor, { action: 'Company Admin created', company_id: companyId, company_name: company.company_name, details: `Created ${dto.name} as Company Admin for ${company.company_name}.` });
    return admin;
  });
}

function payments({ companyId, status, search } = {}) {
  const data = load();
  const ids = new Set(companies().map((c) => c.company_id));
  let list = data.transactions.filter((t) => ids.has(t.company_id));
  if (companyId) list = list.filter((t) => t.company_id === companyId);
  if (status && status !== 'all') list = list.filter((t) => t.payment_status === status);
  let enriched = list.map((t) => {
    const company = data.companies.find((c) => c.company_id === t.company_id);
    const admin = data.employees.find((e) => e.companyId === t.company_id && e.role === 'COMPANY_ADMIN');
    const plan = data.plans.find((p) => p.plan_id === t.plan_id);
    return { ...t, company_name: company ? company.company_name : t.company_id, company_admin_name: admin ? admin.emp_name : null, plan_name: plan ? plan.name : t.plan_id };
  });
  if (search) {
    const q = search.toLowerCase();
    enriched = enriched.filter((t) => t.company_name.toLowerCase().includes(q) || (t.company_admin_name || '').toLowerCase().includes(q));
  }
  return enriched.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));
}

function paymentSummary() {
  const data = load();
  const list = companies();
  const ids = new Set(list.map((c) => c.company_id));
  const paid = list.filter((c) => c.last_payment_date && c.next_billing_date && new Date(c.next_billing_date) > new Date());
  return {
    assigned_companies: list.length,
    paid_payments: paid.length,
    pending_payments: list.length - paid.length,
    revenue: data.transactions.filter((t) => ids.has(t.company_id) && t.payment_status === 'PAID').reduce((sum, t) => sum + t.amount, 0),
  };
}

function dashboardSummary() {
  const data = load();
  const scope = platformScope();
  const mine = (e) => e.platform_admin_id === scope;
  const tickets = data.tickets.filter(mine);
  const open = ['OPEN', 'IN_PROGRESS'];
  const technical = data.employees.filter((e) => e.role === 'TECHNICAL_MEMBER' && mine(e));
  const support = data.employees.filter((e) => e.role === 'SUPPORT_MEMBER' && mine(e));
  const list = companies();
  return {
    assigned_companies: list.length,
    active_companies: list.filter((c) => c.status === 'ACTIVE').length,
    technical_team_count: technical.length,
    support_team_count: support.length,
    open_technical_issues: tickets.filter((t) => t.ticket_type === 'TECHNICAL' && open.includes(t.status)).length,
    open_support_tickets: tickets.filter((t) => t.ticket_type === 'SUPPORT' && open.includes(t.status)).length,
    pending_escalations: data.criticalEscalations.filter((e) => e.raised_by === scope && e.status !== 'RESOLVED').length,
    recent_activity: data.activityLogs
      .filter((a) => a.user_id === scope)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5),
  };
}

// ---- Support Member read-only lookups (support-member.service.ts) ----
function companySummary(companyId) {
  const scope = supportScope();
  const data = load();
  const c = data.companies.find((x) => x.company_id === companyId);
  if (!c || (scope && c.platform_admin_id !== scope)) fail('Company not found');
  const pa = data.employees.find((e) => e.emp_id === c.platform_admin_id);
  const enriched = enrichCompany(data, c);
  return {
    company_id: c.company_id,
    company_name: c.company_name,
    assigned_platform_admin: pa ? pa.emp_name : null,
    company_admin: enriched.company_admin_name,
    subscription_plan: enriched.subscription_plan_name,
    employee_count: enriched.employee_count,
  };
}

function linkedTechnicalTicket(id) {
  const scope = supportScope();
  const data = load();
  const t = data.tickets.find((x) => x.ticket_id === id && x.ticket_type === 'TECHNICAL');
  if (!t || (scope && t.platform_admin_id !== scope)) fail('Technical ticket not found');
  const assignee = data.employees.find((e) => e.emp_id === t.assigned_to);
  return { ...t, assigned_to_name: assignee ? assignee.emp_name : null };
}

function notificationsFor(empId) {
  return load().notifications.filter((n) => n.employee_id === empId).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Every export resolves asynchronously, like the API it stands in for.
const asyncify = (fn) => (...args) => new Promise((resolveFn, reject) => {
  try {
    resolveFn(fn(...args));
  } catch (error) {
    reject(error);
  }
});

export const demo = Object.fromEntries(Object.entries({
  // Platform Admin
  dashboardSummary, companies, createCompanyAdmin, payments, paymentSummary,
  teamList, teamCreate, teamUpdate, teamUpdateStatus,
  workload: () => ({ technical: teamList('TECHNICAL_MEMBER'), support: teamList('SUPPORT_MEMBER') }),
  paTickets: (type, filters) => listTickets(type, platformScope(), filters),
  paTicket: (type, id) => getTicket(type, id, platformScope()),
  assign, reassign, escalateToSuperAdmin, verifyResolution, rejectResolution,
  paResolve: (type, id, notes) => resolve(type, id, notes, platformScope()),
  paComment: (type, id, message) => addComment(type, id, message, platformScope()),
  // Support Member
  supportStats,
  categories: () => load().ticketCategories,
  smTickets: (filters) => listTickets('SUPPORT', supportScope(), { ...filters, assignedTo: filters.assignedTo === 'me' ? sessionActor().emp_id : filters.assignedTo }),
  smTicket: (id) => getTicket('SUPPORT', id, supportScope()),
  claim, changeStatus, changePriority, changeCategory, reopen, close, addInternalNote, escalateToTechnical, escalateToPlatformAdmin,
  smResolve: (id, notes) => resolve('SUPPORT', id, notes, supportScope()),
  smComment: (id, message) => addComment('SUPPORT', id, message, supportScope()),
  companySummary, linkedTechnicalTicket,
  // Shared
  notificationsFor,
}).map(([name, fn]) => [name, asyncify(fn)]));
