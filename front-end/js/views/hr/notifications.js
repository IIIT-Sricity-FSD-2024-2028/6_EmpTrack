// /js/views/hr/notifications.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const dummyNotifs = [
        { id: 1, type: 'critical', icon: 'ph-siren', color: '#EF4444', title: 'Critical Escalation', desc: 'Employee John Smith has exceeded 3 days of unauthorized absence.', source: 'System Auto-Alert', time: '2 mins ago', tags: [{label:'CRITICAL', bg:'#fee2e2', text:'#ef4444'}, {label:'ACTION REQUIRED', bg:'#fee2e2', text:'#ef4444'}], unread: true },
        { id: 2, type: 'high', icon: 'ph-warning-octagon', color: '#F97316', title: 'Unauthorized Leave', desc: 'Manager reported unauthorized leave for Michael Davis.', source: 'David Clark (Lead)', time: '1 hour ago', tags: [{label:'HIGH', bg:'#ffedd5', text:'#f97316'}, {label:'ATTENDANCE', bg:'#e0e7ff', text:'#4f46e5'}], unread: true },
        { id: 3, type: 'high', icon: 'ph-clock', color: '#F97316', title: 'Attendance Alert', desc: '3 employees missed the late check-in buffer today.', source: 'Time Tracking System', time: '3 hours ago', tags: [{label:'ATTENDANCE', bg:'#e0e7ff', text:'#4f46e5'}], unread: false },
        { id: 4, type: 'escalation', icon: 'ph-arrow-fat-lines-up', color: '#800040', title: 'HR Escalation', desc: 'Conflict resolution requested by Engineering team lead.', source: 'Emma Wilson', time: '4 hours ago', tags: [{label:'ESCALATION', bg:'#f3e8ff', text:'#9333ea'}], unread: true },
        { id: 5, type: 'info', icon: 'ph-user-plus', color: '#EAB308', title: 'Employee Onboarding', desc: 'New hire documents completed for Robert Chen.', source: 'Onboarding Portal', time: 'Yesterday', tags: [{label:'INFO', bg:'#fef9c3', text:'#ca8a04'}], unread: false },
        { id: 6, type: 'escalation', icon: 'ph-file-text', color: '#EF4444', title: 'Compliance Report', desc: 'Monthly compliance audit requires HR sign-off.', source: 'Compliance System', time: 'Yesterday', tags: [{label:'ACTION REQUIRED', bg:'#fee2e2', text:'#ef4444'}], unread: false },
        { id: 7, type: 'info', icon: 'ph-arrows-clockwise', color: '#3B82F6', title: 'System Update', desc: 'EmpTrack successfully updated to v2.4.', source: 'IT Admin', time: '2 days ago', tags: [{label:'SYSTEM', bg:'#dbeafe', text:'#2563eb'}], unread: false },
        { id: 8, type: 'info', icon: 'ph-user-minus', color: '#F97316', title: 'Employee Departure', desc: 'Exit interview scheduled for Alice Cooper.', source: 'HR Calendar', time: '2 days ago', tags: [{label:'INFO', bg:'#fef9c3', text:'#ca8a04'}], unread: false },
        { id: 9, type: 'info', icon: 'ph-chart-bar', color: '#22C55E', title: 'Attendance Summary', desc: 'Weekly attendance report generation complete.', source: 'Reporting Engine', time: 'Last week', tags: [{label:'REPORT', bg:'#dcfce7', text:'#16a34a'}], unread: false },
        { id: 10, type: 'action', icon: 'ph-shield-check', color: '#F97316', title: 'Policy Update', desc: 'Please review and publish the revised remote work policy.', source: 'Legal Dept', time: 'Last week', tags: [{label:'ACTION REQUIRED', bg:'#ffedd5', text:'#f97316'}], unread: false }
    ];

    const listContainer = document.getElementById('hr-notif-list');
    
    async function renderNotifications() {
        if (!listContainer) return;

        listContainer.innerHTML = dummyNotifs.map(n => `
            <div class="notif-item ${n.unread ? 'unread' : ''}" data-type="${n.type}" data-unread="${n.unread}" data-id="${n.id}" data-action="${n.tags.some(t => t.label==='ACTION REQUIRED')}">
                <div class="ni-icon" style="background: ${n.color}15; color: ${n.color}; border: 1px solid ${n.color}30;">
                    <i class="${n.icon}"></i>
                </div>
                <div class="ni-content">
                    <div class="ni-header">
                        <h4 class="ni-title search-target">${n.title}</h4>
                        <span class="ni-time">${n.time}</span>
                    </div>
                    <p class="ni-desc search-target">${n.desc}</p>
                    <div class="ni-meta"><i class="ph-fill ph-user-circle"></i> ${n.source}</div>
                    <div class="ni-tags">
                        ${n.tags.map(t => `<span class="ni-tag" style="background:${t.bg}; color:${t.text};">${t.label}</span>`).join('')}
                    </div>
                </div>
                <div class="ni-actions">
                    <button class="ni-action-btn btn-done" data-id="${n.id}" title="Mark as Done/Read"><i class="ph ph-check"></i></button>
                    <button class="ni-action-btn btn-del" data-id="${n.id}" title="Dismiss"><i class="ph ph-x"></i></button>
                </div>
            </div>
        `).join('');

        attachActionListeners();
    }

    renderNotifications();

    let activeFilter = 'all';

    async function filterNotifs() {
        const term = document.getElementById('notif-search').value.toLowerCase();
        const items = document.querySelectorAll('.notif-item');
        
        items.forEach(item => {
            const isUnread = item.dataset.unread === 'true';
            const isAction = item.dataset.action === 'true';
            const isEsc = item.dataset.type === 'escalation';
            
            let passFilter = true;
            if(activeFilter === 'unread' && !isUnread) passFilter = false;
            if(activeFilter === 'escalation' && !isEsc) passFilter = false;
            if(activeFilter === 'action' && !isAction) passFilter = false;

            let passSearch = true;
            if(term) {
                const text = Array.from(item.querySelectorAll('.search-target')).map(el => el.innerText.toLowerCase()).join(' ');
                if(!text.includes(term)) passSearch = false;
            }

            item.style.display = (passFilter && passSearch) ? 'flex' : 'none';
        });
    }

    const searchInput = document.getElementById('notif-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterNotifs);
    }

    const filterBtns = document.querySelectorAll('.tab-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', async (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            filterNotifs();
        });
    });

    async function updateUnreadCount() {
        const c = document.querySelectorAll('.notif-item.unread').length;
        document.getElementById('met-unread').innerText = c;
        document.getElementById('sc-unread').innerText = c;
    }

    async function attachActionListeners() {
        document.querySelectorAll('.btn-done').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.currentTarget.closest('.notif-item');
                item.classList.remove('unread');
                item.dataset.unread = 'false';
                updateUnreadCount();
                if(activeFilter === 'unread') filterNotifs();
            });
        });

        document.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const item = e.currentTarget.closest('.notif-item');
                item.style.animation = 'slideOutRight 0.3s ease forwards';
                setTimeout(() => {
                    item.remove();
                    updateUnreadCount();
                }, 300);
            });
        });
    }

    const markAllBtn = document.getElementById('btn-mark-all');
    if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
            document.querySelectorAll('.notif-item.unread').forEach(item => {
                item.classList.remove('unread');
                item.dataset.unread = 'false';
            });
            updateUnreadCount();
            if(activeFilter === 'unread') filterNotifs();
            
            const toast = document.getElementById('prof-toast');
            if(toast) {
                toast.innerHTML = '<i class="ph-fill ph-check-circle"></i> All notifications marked as read!';
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }
        });
    }

});
