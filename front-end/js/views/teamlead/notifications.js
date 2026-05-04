// /js/views/teamlead/notifications.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const dummyNotifs = [
        { id: 1, type: 'alert', icon: 'ph-warning-octagon', color: '#EF4444', title: 'Task Escalation', desc: 'A critical bug in the authentication module was escalated.', source: 'Jane Doe', time: '10 mins ago', tags: [{label:'ESCALATION', bg:'#fee2e2', text:'#ef4444'}], unread: true },
        { id: 2, type: 'leave', icon: 'ph-calendar-plus', color: '#F97316', title: 'New Leave Request', desc: 'Alice is requesting leave for next week. Approval needed.', source: 'Alice Walker', time: '1 hour ago', tags: [{label:'ACTION REQUIRED', bg:'#ffedd5', text:'#f97316'}], unread: true },
        { id: 3, type: 'alert', icon: 'ph-check-square-offset', color: '#22C55E', title: 'Task Completed', desc: 'Bob finished his assigned sprint tasks successfully.', source: 'Bob Smith', time: '3 hours ago', tags: [{label:'COMPLETED', bg:'#dcfce7', text:'#16a34a'}], unread: false },
        { id: 4, type: 'leave', icon: 'ph-calendar-check', color: '#3B82F6', title: 'Leave Feedback', desc: 'Charlie has returned from sick leave.', source: 'Charlie Day', time: 'Yesterday', tags: [{label:'REMINDER', bg:'#dbeafe', text:'#2563eb'}], unread: false }
    ];

    const listContainer = document.getElementById('tl-notif-list');
    
    async function renderNotifications() {
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

    async function filterNotifs() {
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
        btn.addEventListener('click', async (e) => {
            filterBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeFilter = e.target.dataset.filter;
            filterNotifs();
        });
    });

    async function updateUnreadCount() {
        const c = document.querySelectorAll('.notif-item.unread').length;
        const unreadMetric = document.getElementById('met-unread');
        if (unreadMetric) unreadMetric.innerText = c;
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
