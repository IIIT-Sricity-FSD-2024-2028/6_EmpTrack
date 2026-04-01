// /js/views/teamlead/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getTeamLeadNotifs = () => {
        let notifs = [];
        let idCount = 1;

        // Leaves received
        const teamIds = db.getUsersByManager(user.emp_id).map(u => u.emp_id);
        const leaves = db.getAllLeaves().filter(l => teamIds.includes(l.emp_id));
        leaves.forEach(l => {
            const emp = db.getUserById(l.emp_id);
            notifs.push({
                id: idCount++,
                type: 'leave',
                icon: 'ph-calendar-plus',
                color: '#F97316',
                title: 'Leave Request',
                desc: `${emp.emp_name.split(' (')[0]} requested leave (${l.days} days).`,
                source: emp.emp_name.split(' (')[0],
                time: l.applied_date,
                tags: [{label: l.status, bg:'#ffedd5', text:'#f97316'}],
                unread: l.status === 'PENDING'
            });
        });

        // Tasks completed
        const tasks = db.getAllTasksForManager(user.emp_id).filter(t => t.status === 'COMPLETED');
        tasks.forEach(t => {
            const emp = db.getUserById(t.assigned_to);
            notifs.push({
                id: idCount++,
                type: 'alert',
                icon: 'ph-check-square-offset',
                color: '#22C55E',
                title: 'Task Completed',
                desc: `${emp.emp_name.split(' (')[0]} finished task: ${t.task_title}.`,
                source: emp.emp_name.split(' (')[0],
                time: t.updated_date,
                tags: [{label: 'COMPLETED', bg:'#dcfce7', text:'#16a34a'}],
                unread: false
            });
        });

        notifs.push({ id: idCount++, type: 'alert', icon: 'ph-megaphone', color: '#8B5CF6', title: 'System Setup', desc: 'Welcome to the Team Lead Notification Hub!', source: 'System', time: 'Initial', tags: [{label:'SYSTEM', bg:'#ede9fe', text:'#7c3aed'}], unread: false });

        return notifs.reverse();
    };

    const dummyNotifs = getTeamLeadNotifs();

    const listContainer = document.getElementById('tl-notif-list');
    
    function renderNotifications() {
        if (!listContainer) return;

        listContainer.innerHTML = dummyNotifs.map(n => `
            <div class="notif-item ${n.unread ? 'unread' : ''}" data-type="${n.type}" data-unread="${n.unread}" data-id="${n.id}">
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
                    <button class="ni-action-btn btn-done" data-id="${n.id}" title="Mark as Read"><i class="ph ph-check"></i></button>
                    <button class="ni-action-btn btn-del" data-id="${n.id}" title="Dismiss"><i class="ph ph-x"></i></button>
                </div>
            </div>
        `).join('');

        attachActionListeners();
        updateUnreadCount();
    }

    renderNotifications();

    let activeFilter = 'all';

    function filterNotifs() {
        const items = document.querySelectorAll('.notif-item');
        
        items.forEach(item => {
            const isUnread = item.dataset.unread === 'true';
            const type = item.dataset.type;
            
            let passFilter = true;
            if(activeFilter === 'unread' && !isUnread) passFilter = false;
            if(activeFilter === 'alert' && type !== 'alert') passFilter = false;
            if(activeFilter === 'leave' && type !== 'leave') passFilter = false;

            item.style.display = passFilter ? 'flex' : 'none';
        });
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
        const unreadMetric = document.getElementById('met-unread');
        if (unreadMetric) unreadMetric.innerText = c;
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
