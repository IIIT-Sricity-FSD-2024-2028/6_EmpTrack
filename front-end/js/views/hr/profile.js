// /js/views/hr/profile.js

export function renderHRProfile(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">Profile</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
            <button class="btn-edit" style="padding:8px 16px; background:transparent; color:var(--prof-primary); border:1px solid var(--prof-primary); border-radius:6px; font-size:13px; font-weight:600; cursor:pointer; display:flex; align-items:center; gap:6px; transition:0.2s;" onclick="alert('Edit Profile mode under development.')">
                <i class="ph ph-pencil-simple"></i> Edit Profile
            </button>
        </div>
    `;

    container.innerHTML = `
        <style>
            .hr-prof-root {
                --prof-primary: #800040;
                --prof-secondary: #6a0dad;
                --prof-bg: var(--bg-surface);
                --prof-border: var(--border-color);
                --prof-text: var(--text-main);
                --prof-muted: var(--text-muted);
                
                animation: hrFadeIn 0.3s ease-out forwards;
                display: flex;
                flex-direction: column;
                gap: 24px;
                font-family: 'Poppins', 'Inter', sans-serif;
            }

            @keyframes hrFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .hr-prof-root .card {
                background: var(--prof-bg);
                border: 1px solid var(--prof-border);
                border-radius: 16px;
                box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
                padding: 24px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .hr-prof-root .card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
            
            /* Banner */
            .hr-prof-root .profile-banner {
                background: linear-gradient(135deg, #1e1b4b 0%, #311042 50%, #4a044e 100%);
                color: white;
                border: none;
                display: flex;
                align-items: center;
                gap: 32px;
                padding: 32px;
                position: relative;
                overflow: hidden;
            }
            .hr-prof-root .profile-banner::after {
                content: ''; position: absolute; top:0; right:0; width: 300px; height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.03));
                transform: skewX(-20deg) translateX(50px);
            }
            .hr-prof-root .avatar-large {
                width: 100px; height: 100px; border-radius: 50%;
                background: linear-gradient(135deg, var(--prof-secondary), var(--prof-primary));
                display: flex; align-items: center; justify-content: center;
                font-size: 36px; font-weight: 700; border: 4px solid rgba(255,255,255,0.2);
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                flex-shrink: 0; position: relative;
            }
            .hr-prof-root .avatar-overlay {
                position: absolute; inset: 0; background: rgba(0,0,0,0.5); border-radius: 50%;
                display: flex; align-items: center; justify-content: center; opacity: 0; transition: 0.2s; cursor: pointer;
            }
            .hr-prof-root .avatar-large:hover .avatar-overlay { opacity: 1; }

            .hr-prof-root .banner-info { display: flex; flex-direction: column; gap: 8px; z-index: 1;}
            .hr-prof-root .banner-name { font-size: 28px; font-weight: 700; margin: 0; line-height: 1.2; }
            .hr-prof-root .banner-role { font-size: 15px; color: rgba(255,255,255,0.8); font-weight: 500; }
            .hr-prof-root .banner-meta { display: flex; gap: 24px; font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 8px; flex-wrap: wrap; }
            .hr-prof-root .bm-item { display: flex; align-items: center; gap: 6px; }

            /* Stats */
            .hr-prof-root .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }
            .hr-prof-root .stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
            .hr-prof-root .stat-icon { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24px; flex-shrink: 0; }
            
            /* Split layout */
            .hr-prof-root .split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            @media (max-width: 900px) { .hr-prof-root .split-grid { grid-template-columns: 1fr; } .hr-prof-root .profile-banner { flex-direction: column; text-align: center; gap: 20px; } .hr-prof-root .banner-meta { justify-content: center; } }

            .hr-prof-root .info-list { display: flex; flex-direction: column; gap: 16px; margin-top: 20px; }
            .hr-prof-root .il-item { display: flex; flex-direction: column; gap: 4px; }
            .hr-prof-root .il-label { font-size: 12px; color: var(--prof-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }
            .hr-prof-root .il-val { font-size: 14px; color: var(--prof-text); font-weight: 500; }

            /* Tags */
            .hr-prof-root .tags-wrap { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
            .hr-prof-root .skill-tag { 
                padding: 6px 14px; background: rgba(106, 13, 173, 0.08); color: var(--prof-secondary); 
                border-radius: 20px; font-size: 13px; font-weight: 600; cursor: default;
                transition: 0.2s; border: 1px solid rgba(106, 13, 173, 0.1);
            }
            .hr-prof-root .skill-tag:hover { background: var(--prof-secondary); color: white; transform: translateY(-2px); }

            /* Form */
            .hr-prof-root .form-group { margin-bottom: 16px; position: relative; }
            .hr-prof-root label { display: block; font-size: 13px; font-weight: 500; color: var(--prof-muted); margin-bottom: 6px; }
            .hr-prof-root .input-wrap { position: relative; }
            .hr-prof-root input { width: 100%; padding: 10px 14px; border: 1px solid var(--prof-border); border-radius: 8px; background: var(--bg-main); color: var(--prof-text); font-size: 14px; outline: none; transition: 0.2s; }
            .hr-prof-root input:focus { border-color: var(--prof-primary); box-shadow: 0 0 0 3px rgba(128, 0, 64, 0.1); }
            .hr-prof-root .eye-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: var(--prof-muted); cursor: pointer; }
            
            .hr-prof-root .btn-save { padding: 10px 20px; background: linear-gradient(90deg, var(--prof-secondary), var(--prof-primary)); color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; margin-top: 8px; }
            .hr-prof-root .btn-save:hover { box-shadow: 0 6px 15px rgba(128, 0, 64, 0.3); transform: translateY(-1px); }

            /* Toast */
            #prof-toast { position: fixed; bottom: 24px; right: 24px; background: var(--prof-primary); color: white; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 500; transform: translateY(100px); opacity: 0; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1000; display: flex; align-items: center; gap: 8px; box-shadow: 0 10px 15px rgba(0,0,0,0.2); }
            #prof-toast.show { transform: translateY(0); opacity: 1; }

        </style>

        <div class="hr-prof-root">
            
            <!-- Banner -->
            <div class="card profile-banner">
                <div class="avatar-large">
                    RS
                    <div class="avatar-overlay" onclick="alert('Upload Photo feature coming soon')"><i class="ph ph-camera" style="font-size:24px;"></i></div>
                </div>
                <div class="banner-info">
                    <h2 class="banner-name">Rohini Sai</h2>
                    <div class="banner-role">HR Manager - Human Resources</div>
                    <div class="banner-meta">
                        <div class="bm-item"><i class="ph ph-briefcase"></i> 8 years experience</div>
                        <div class="bm-item"><i class="ph ph-calendar-blank"></i> Joined 2017-06-01</div>
                        <div class="bm-item"><i class="ph ph-map-pin"></i> New York, HQ</div>
                    </div>
                </div>
            </div>

            <!-- Stats -->
            <div class="stats-grid">
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(106, 13, 173, 0.1); color: var(--prof-secondary);"><i class="ph-fill ph-briefcase"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">12</div><div style="font-size:13px; color:var(--prof-muted); font-weight:500;">Active Cases</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(34, 197, 94, 0.1); color: #22C55E;"><i class="ph-fill ph-users-three"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">6</div><div style="font-size:13px; color:var(--prof-muted); font-weight:500;">Team Leads Managed</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6;"><i class="ph-fill ph-file-text"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">8</div><div style="font-size:13px; color:var(--prof-muted); font-weight:500;">Policies Implemented</div></div>
                </div>
                <div class="card stat-card">
                    <div class="stat-icon" style="background: rgba(249, 115, 22, 0.1); color: #F97316;"><i class="ph-fill ph-medal"></i></div>
                    <div><div style="font-size:24px; font-weight:700;">23</div><div style="font-size:13px; color:var(--prof-muted); font-weight:500;">Awards Given</div></div>
                </div>
            </div>

            <div class="split-grid">
                <!-- Personal Info -->
                <div class="card">
                    <h3 style="margin:0; font-size:16px; color:var(--prof-text); display:flex; align-items:center; gap:8px;"><i class="ph-fill ph-identification-card" style="color:var(--prof-primary);"></i> Personal Information</h3>
                    <div class="info-list">
                        <div class="il-item"><span class="il-label">Employee ID</span><span class="il-val">HR-001</span></div>
                        <div class="il-item"><span class="il-label">Email</span><span class="il-val">rohini.sai@emptrack.com</span></div>
                        <div class="il-item"><span class="il-label">Phone</span><span class="il-val">+1 (555) 345-6789</span></div>
                        <div class="il-item"><span class="il-label">Address</span><span class="il-val">123 Corporate Blvd, Suite 400<br>New York, NY 10001</span></div>
                    </div>
                </div>

                <!-- Work Info -->
                <div class="card">
                    <h3 style="margin:0; font-size:16px; color:var(--prof-text); display:flex; align-items:center; gap:8px;"><i class="ph-fill ph-buildings" style="color:var(--prof-secondary);"></i> Work Information</h3>
                    <div class="info-list">
                        <div class="il-item"><span class="il-label">Department</span><span class="il-val">Human Resources</span></div>
                        <div class="il-item"><span class="il-label">Role</span><span class="il-val">HR Manager</span></div>
                        <div class="il-item"><span class="il-label">Years of Experience</span><span class="il-val">8 Years</span></div>
                        <div class="il-item"><span class="il-label">Reporting To</span><span class="il-val">Chief HR Officer (Jane Doe)</span></div>
                    </div>
                </div>
            </div>

            <div class="split-grid">
                <!-- Skills -->
                <div class="card">
                    <h3 style="margin:0; font-size:16px; color:var(--prof-text); display:flex; align-items:center; gap:8px;"><i class="ph-fill ph-star" style="color:#F97316;"></i> Skills & Expertise</h3>
                    <div class="tags-wrap">
                        <div class="skill-tag">HR Management</div>
                        <div class="skill-tag">Employee Relations</div>
                        <div class="skill-tag">Recruitment</div>
                        <div class="skill-tag">Performance Management</div>
                        <div class="skill-tag">Policy Development</div>
                        <div class="skill-tag">Conflict Resolution</div>
                        <div class="skill-tag">Compliance</div>
                        <div class="skill-tag">Training & Development</div>
                    </div>
                </div>

                <!-- Password -->
                <div class="card">
                    <h3 style="margin:0 0 20px 0; font-size:16px; color:var(--prof-text); display:flex; align-items:center; gap:8px;"><i class="ph-fill ph-lock-key" style="color:#22C55E;"></i> Change Password</h3>
                    <form onsubmit="event.preventDefault(); window.escUpdatePwd(this);">
                        <div class="form-group">
                            <label>Current Password</label>
                            <div class="input-wrap">
                                <input type="password" required>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>New Password</label>
                            <div class="input-wrap">
                                <input type="password" id="newPwd" required minlength="8" oninput="window.checkPwdMatch()">
                                <i class="ph ph-eye eye-icon" onclick="window.togglePwd(this)"></i>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Confirm New Password</label>
                            <div class="input-wrap">
                                <input type="password" id="confPwd" required oninput="window.checkPwdMatch()">
                                <i class="ph ph-eye eye-icon" onclick="window.togglePwd(this)"></i>
                            </div>
                            <div id="pwdErr" style="color:#EF4444; font-size:12px; margin-top:4px; display:none;">Passwords do not match</div>
                        </div>
                        <button type="submit" class="btn-save" id="btnUpdatePwd">Update Password</button>
                    </form>
                </div>
            </div>

            <div id="prof-toast"><i class="ph-fill ph-check-circle"></i> Password updated successfully!</div>

        </div>
    `;

    window.togglePwd = function(icon) {
        const input = icon.previousElementSibling;
        if(input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('ph-eye', 'ph-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('ph-eye-slash', 'ph-eye');
        }
    };

    window.checkPwdMatch = function() {
        const p1 = document.getElementById('newPwd').value;
        const p2 = document.getElementById('confPwd').value;
        const err = document.getElementById('pwdErr');
        const btn = document.getElementById('btnUpdatePwd');
        
        if(p2.length > 0 && p1 !== p2) {
            err.style.display = 'block';
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            err.style.display = 'none';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    };

    window.escUpdatePwd = function(form) {
        if(!form.checkValidity()) { form.reportValidity(); return; }
        const btn = document.getElementById('btnUpdatePwd');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Updating...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = ogText;
            btn.disabled = false;
            form.reset();
            const toast = document.getElementById('prof-toast');
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 3000);
        }, 600);
    };

}
