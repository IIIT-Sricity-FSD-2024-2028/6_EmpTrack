// /js/views/hr/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getHRNotifs = () => {
        let notifs = [];
        let idCount = 1;

        // Escalations
        const escalations = db.getAllEscalations();
        escalations.forEach(e => {
            const emp = db.getUserById(e.escalated_from) || db.getUserById(e.escalated_by);
            let name = emp ? emp.emp_name.split(' (')[0] : 'Unknown';
            notifs.push({
                id: idCount++,
                type: 'escalation',
                icon: 'ph-siren',
                color: '#EF4444',
                title: 'Escalation Alert',
                desc: `${e.escalation_reason || e.issue_title || 'Issue escalated to HR.'}`,
                source: name,
                time: e.escalation_date || e.escalated_on || new Date().toISOString().split('T')[0],
                tags: [{label: 'ESCALATION', bg:'#fee2e2', text:'#ef4444'}],
                unread: (e.status === 'OPEN' || e.status === 'Open')
            });
        });

        // New Employees
        const today = new Date().toISOString().split('T')[0];
        const newEmps = db.data.employee.filter(e => e.date_of_joining >= '2025-01-01');
        newEmps.forEach(e => {
            notifs.push({
                id: idCount++,
                type: 'info',
                icon: 'ph-user-plus',
                color: '#EAB308',
                title: 'Employee Onboarding',
                desc: `New hire ${e.emp_name.split(' (')[0]} joined on ${e.date_of_joining}.`,
                source: 'Onboarding Portal',
                time: e.date_of_joining,
                tags: [{label:'INFO', bg:'#fef9c3', text:'#ca8a04'}],
                unread: false
            });
        });

        notifs.push({ id: idCount++, type: 'info', icon: 'ph-megaphone', color: '#8B5CF6', title: 'System Ready', desc: 'Welcome to the HR Notification Engine!', source: 'System', time: 'Initial', tags: [{label:'SYSTEM', bg:'#ede9fe', text:'#7c3aed'}], unread: false });

        return notifs.reverse();
    };

    const dummyNotifs = getHRNotifs();

    const listContainer = document.getElementById('hr-notif-list');
    
    function renderNotifications() {
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

    function filterNotifs() {
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
        btn.addEventListener('click', (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            filterNotifs();
        });
    });

    function updateUnreadCount() {
        const c = document.querySelectorAll('.notif-item.unread').length;
        document.getElementById('met-unread').innerText = c;
        document.getElementById('sc-unread').innerText = c;
    }

    function attachActionListeners() {
        document.querySelectorAll('.btn-done').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const item = e.currentTarget.closest('.notif-item');
                item.classList.remove('unread');
                item.dataset.unread = 'false';
                updateUnreadCount();
                if(activeFilter === 'unread') filterNotifs();
            });
        });

        document.querySelectorAll('.btn-del').forEach(btn => {
            btn.addEventListener('click', (e) => {
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
        markAllBtn.addEventListener('click', () => {
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
