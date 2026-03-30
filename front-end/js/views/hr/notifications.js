// /js/views/hr/notifications.js

export function renderHRNotifications(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Notifications</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
            <div style="display:flex; gap:12px;">
                <input type="text" id="notifSearch" placeholder="Search notifications..." style="padding:8px 12px; border:1px solid var(--border-color); border-radius:6px; background:var(--bg-main); color:var(--text-main); font-size:13px; outline:none;" onkeyup="window.hrFilterNotifs()">
            </div>
        </div>
    `;

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

    container.innerHTML = `
        <style>
            .hr-notif-root {
                --nt-primary: #800040;
                --nt-secondary: #6a0dad;
                --nt-bg: var(--bg-surface);
                --nt-border: var(--border-color);
                --nt-text: var(--text-main);
                --nt-muted: var(--text-muted);
                
                animation: hrFadeIn 0.3s ease-out forwards;
                display: flex;
                flex-direction: column;
                gap: 24px;
                font-family: 'Poppins', 'Inter', sans-serif;
            }

            @keyframes hrFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes slideOutRight { to { opacity: 0; transform: translateX(50px); } }

            .hr-notif-root .card {
                background: var(--nt-bg);
                border: 1px solid var(--nt-border);
                border-radius: 14px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                padding: 24px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            
            /* Banner */
            .hr-notif-root .highlight-banner {
                background: linear-gradient(135deg, var(--nt-secondary), var(--nt-primary));
                color: white;
                border: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 20px;
                padding: 32px;
            }
            .hr-notif-root .hb-title { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; }
            .hr-notif-root .hb-sub { font-size: 14px; color: rgba(255,255,255,0.8); }
            .hr-notif-root .hb-metrics { display: flex; gap: 24px; }
            .hr-notif-root .hb-metric { display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.2); padding: 12px 20px; border-radius: 12px; }
            .hr-notif-root .hb-metric-val { font-size: 24px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
            .hr-notif-root .hb-metric-lbl { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8; }

            /* Stats Grid */
            .hr-notif-root .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
            .hr-notif-root .stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; cursor:default; }
            .hr-notif-root .stat-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            .hr-notif-root .stat-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }

            /* Filters */
            .hr-notif-root .filter-bar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 8px; }
            .hr-notif-root .tab-list { display: flex; gap: 8px; flex-wrap: wrap; }
            .hr-notif-root .tab-btn { padding: 8px 16px; border-radius: 20px; background: transparent; border: 1px solid var(--nt-border); color: var(--nt-muted); font-size: 13px; font-weight: 600; cursor: pointer; transition: 0.2s; }
            .hr-notif-root .tab-btn:hover { background: var(--bg-main); color: var(--nt-text); }
            .hr-notif-root .tab-btn.active { background: rgba(106,13,173,0.1); color: var(--nt-secondary); border-color: var(--nt-secondary); }
            
            .hr-notif-root .btn-read-all { padding: 8px 16px; background: #22C55E; color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
            .hr-notif-root .btn-read-all:hover { background: #16a34a; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(34,197,94,0.3); }

            /* Notification List */
            .hr-notif-root .notif-list { display: flex; flex-direction: column; gap: 16px; }
            .hr-notif-root .notif-item { 
                background: var(--nt-bg); border: 1px solid var(--nt-border); border-radius: 12px;
                padding: 20px; display: flex; gap: 20px; transition: transform 0.2s, box-shadow 0.2s;
                position: relative; overflow: hidden;
            }
            .hr-notif-root .notif-item:hover { transform: translateY(-2px); box-shadow: 0 6px 12px -2px rgba(0,0,0,0.05); }
            
            .hr-notif-root .notif-item.unread::after { content:''; position:absolute; top:20px; right:20px; width:10px; height:10px; background:#3B82F6; border-radius:50%; box-shadow:0 0 0 4px rgba(59,130,246,0.1); }
            
            .hr-notif-root .ni-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
            .hr-notif-root .ni-content { flex: 1; display: flex; flex-direction: column; gap: 6px; padding-right: 32px; }
            .hr-notif-root .ni-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
            .hr-notif-root .ni-title { font-size: 15px; font-weight: 600; color: var(--nt-text); margin: 0; }
            .hr-notif-root .ni-time { font-size: 12px; color: var(--nt-muted); white-space: nowrap; }
            .hr-notif-root .ni-desc { font-size: 13px; color: var(--nt-muted); line-height: 1.5; margin: 0; }
            .hr-notif-root .ni-meta { font-size: 12px; font-weight: 500; color: var(--nt-text); display: flex; align-items: center; gap: 6px; margin-top: 4px; }
            
            .hr-notif-root .ni-tags { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
            .hr-notif-root .ni-tag { padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

            .hr-notif-root .ni-actions { display: flex; flex-direction: column; gap: 8px; justify-content: center; }
            .hr-notif-root .ni-action-btn { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--nt-border); background: transparent; color: var(--nt-muted); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
            .hr-notif-root .ni-action-btn:hover { background: var(--bg-main); color: var(--nt-text); }
            .hr-notif-root .ni-action-btn.btn-done:hover { background: #dcfce7; color: #16a34a; border-color: #16a34a; }
            .hr-notif-root .ni-action-btn.btn-del:hover { background: #fee2e2; color: #ef4444; border-color: #ef4444; }

            @media (max-width: 600px) {
                .hr-notif-root .notif-item { flex-direction: column; gap: 16px; }
                .hr-notif-root .ni-actions { flex-direction: row; justify-content: flex-start; }
                .hr-notif-root .ni-content { padding-right: 0; }
                .hr-notif-root .notif-item.unread::after { top: 24px; right: 24px; }
            }
        </style>

        <div class="hr-notif-root">
            
            <div class="card highlight-banner">
                <div>
                    <h2 class="hb-title">HR Notifications</h2>
                    <div class="hb-sub">Monitor critical HR activities and escalations</div>
                </div>
                <div class="hb-metrics">
                    <div class="hb-metric"><span class="hb-metric-val" id="met-unread">3</span><span class="hb-metric-lbl">Unread</span></div>
                    <div class="hb-metric"><span class="hb-metric-val">2</span><span class="hb-metric-lbl">Escalations</span></div>
                    <div class="hb-metric"><span class="hb-metric-val">3</span><span class="hb-metric-lbl">Actions</span></div>
                </div>
            </div>

            <div class="stats-grid">
                <div class="card stat-card" style="border-left: 4px solid #EF4444;">
                    <div class="stat-icon" style="background: rgba(239,68,68,0.1); color: #EF4444;"><i class="ph-fill ph-siren"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">1</div><div style="font-size:13px; color:var(--nt-muted); font-weight:500;">Critical Alerts</div></div>
                </div>
                <div class="card stat-card" style="border-left: 4px solid #F97316;">
                    <div class="stat-icon" style="background: rgba(249,115,22,0.1); color: #F97316;"><i class="ph-fill ph-warning-octagon"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">2</div><div style="font-size:13px; color:var(--nt-muted); font-weight:500;">High Priority</div></div>
                </div>
                <div class="card stat-card" style="border-left: 4px solid var(--nt-secondary);">
                    <div class="stat-icon" style="background: rgba(106,13,173,0.1); color: var(--nt-secondary);"><i class="ph-fill ph-arrow-fat-lines-up"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">2</div><div style="font-size:13px; color:var(--nt-muted); font-weight:500;">Escalations</div></div>
                </div>
                <div class="card stat-card" style="border-left: 4px solid #3B82F6;">
                    <div class="stat-icon" style="background: rgba(59,130,246,0.1); color: #3B82F6;"><i class="ph-fill ph-envelope-simple-open"></i></div>
                    <div><div style="font-size:24px; font-weight:700;" id="sc-unread">3</div><div style="font-size:13px; color:var(--nt-muted); font-weight:500;">Total Unread</div></div>
                </div>
            </div>

            <div class="filter-bar">
                <div class="tab-list">
                    <button class="tab-btn active" onclick="window.hrFilterNotifs('all', this)">All (10)</button>
                    <button class="tab-btn" onclick="window.hrFilterNotifs('escalation', this)">Escalations (2)</button>
                    <button class="tab-btn" onclick="window.hrFilterNotifs('unread', this)">Unread (3)</button>
                    <button class="tab-btn" onclick="window.hrFilterNotifs('action', this)">Action Required (3)</button>
                </div>
                <button class="btn-read-all" onclick="window.hrMarkAllRead()"><i class="ph ph-check-double"></i> Mark All as Read</button>
            </div>

            <div class="notif-list" id="hrNotifList">
                ${dummyNotifs.map(n => `
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
                            <button class="ni-action-btn btn-done" onclick="window.hrMarkRead(${n.id}, this)" title="Mark as Done/Read"><i class="ph ph-check"></i></button>
                            <button class="ni-action-btn btn-del" onclick="window.hrDismissNotif(${n.id}, this)" title="Dismiss"><i class="ph ph-x"></i></button>
                        </div>
                    </div>
                `).join('')}
            </div>

        </div>
    `;

    // Global Functions for UI interaction
    let activeFilter = 'all';

    window.hrFilterNotifs = function(filterId, btnElem) {
        if(btnElem) {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btnElem.classList.add('active');
            activeFilter = filterId;
        }

        const term = document.getElementById('notifSearch').value.toLowerCase();
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
    };

    window.hrMarkRead = function(id, btn) {
        const item = btn.closest('.notif-item');
        item.classList.remove('unread');
        item.dataset.unread = 'false';
        updateUnreadCount();
        if(activeFilter === 'unread') window.hrFilterNotifs(activeFilter); 
    };

    window.hrDismissNotif = function(id, btn) {
        const item = btn.closest('.notif-item');
        item.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => {
            item.remove();
            updateUnreadCount();
        }, 300);
    };

    window.hrMarkAllRead = function() {
        document.querySelectorAll('.notif-item.unread').forEach(item => {
            item.classList.remove('unread');
            item.dataset.unread = 'false';
        });
        updateUnreadCount();
        if(activeFilter === 'unread') window.hrFilterNotifs(activeFilter);
        
        // Optional Toast
        const toast = document.getElementById('prof-toast'); // Reusing system toast if injected in layout, else silent success
        if(toast) {
            toast.innerHTML = '<i class="ph-fill ph-check-circle"></i> All notifications marked as read!';
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }
    };

    function updateUnreadCount() {
        const c = document.querySelectorAll('.notif-item.unread').length;
        document.getElementById('met-unread').innerText = c;
        document.getElementById('sc-unread').innerText = c;
    }
}
