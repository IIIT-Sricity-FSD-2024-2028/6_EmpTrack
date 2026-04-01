// /js/views/employee/notifications.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const getEmployeeNotifs = () => {
        let notifs = [];
        let idCount = 1;
        
        // Tasks
        const tasks = db.getTasksForUser(user.emp_id);
        tasks.forEach(t => {
            notifs.push({
                id: idCount++,
                type: 'task',
                icon: 'ph-check-square-offset',
                color: '#3B82F6',
                title: 'Task Assigned: ' + t.task_title,
                desc: t.task_description,
                source: 'Project Manager',
                time: t.updated_date,
                tags: [{label: t.status.replace('_', ' '), bg:'#dbeafe', text:'#2563eb'}],
                unread: t.status === 'NOT_STARTED'
            });
        });

        // Leaves
        const leaves = db.getLeavesForUser(user.emp_id);
        leaves.forEach(l => {
            let color = '#F97316';
            let bg = '#ffedd5';
            let text = '#f97316';
            if (l.status === 'APPROVED') { color = '#22C55E'; bg = '#dcfce7'; text = '#16a34a'; }
            if (l.status === 'REJECTED') { color = '#EF4444'; bg = '#fee2e2'; text = '#ef4444'; }
            
            notifs.push({
                id: idCount++,
                type: 'leave',
                icon: 'ph-calendar-check',
                color: color,
                title: 'Leave Update',
                desc: `Your leave request for ${l.start_date} is ${l.status}.`,
                source: 'System',
                time: l.applied_date,
                tags: [{label: l.status, bg: bg, text: text}],
                unread: false
            });
        });

        // Some basic static system notifications to pad it
        notifs.push({ id: idCount++, type: 'info', icon: 'ph-megaphone', color: '#8B5CF6', title: 'System Welcome', desc: 'Welcome to the new unified EmpTrack system!', source: 'Internal Comms', time: 'Initial', tags: [{label:'SYSTEM', bg:'#ede9fe', text:'#7c3aed'}], unread: false });

        // Database Notifications (Warnings, Deadline Extensions, etc)
        const dbNotifs = db.getNotificationsForUser(user.emp_id);
        dbNotifs.forEach(n => {
            let color = n.type === 'warning' ? '#DC2626' : '#3B82F6';
            let icon = n.type === 'warning' ? 'ph-warning-octagon' : 'ph-info';
            let bg = n.type === 'warning' ? '#fee2e2' : '#dbeafe';
            let textc = n.type === 'warning' ? '#dc2626' : '#2563eb';
            notifs.push({
                id: n.id, // Keep DB ID for real updates if needed, string works
                type: n.type,
                icon: icon,
                color: color,
                title: n.type === 'warning' ? 'Action Required' : 'Task Update',
                desc: n.message,
                source: 'Team Lead',
                time: n.timestamp.split('T')[0],
                tags: [{label: n.type.toUpperCase(), bg: bg, text: textc}],
                unread: !n.is_read
            });
        });

        return notifs.reverse();
    };

    const dummyNotifs = getEmployeeNotifs();

    const listContainer = document.getElementById('emp-notif-list');
    
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
            if(activeFilter === 'task' && type !== 'task') passFilter = false;
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
