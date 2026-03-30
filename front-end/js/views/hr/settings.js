// /js/views/hr/settings.js

export function renderHRSettings(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">System Settings</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">HR Portal</span>
            </div>
        </div>
    `;

    container.innerHTML = `
        <style>
            .hr-settings-root {
                --set-primary: #6a0dad;
                --set-secondary: #b83280;
                --set-bg: var(--bg-surface);
                --set-border: var(--border-color);
                --set-text: var(--text-main);
                --set-muted: var(--text-muted);
                
                animation: hrFadeIn 0.3s ease-out forwards;
                display: flex;
                flex-direction: column;
                gap: 24px;
                font-family: 'Inter', sans-serif;
            }

            @keyframes hrFadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

            .hr-settings-root .settings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 24px;
            }

            @media (max-width: 900px) {
                .hr-settings-root .settings-grid { grid-template-columns: 1fr; }
            }

            .hr-settings-root .card {
                background: var(--set-bg);
                border: 1px solid var(--set-border);
                border-radius: 12px;
                box-shadow: var(--shadow-sm);
                padding: 24px;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                display: flex;
                flex-direction: column;
            }

            .hr-settings-root .card:hover {
                box-shadow: var(--shadow-md);
            }

            .hr-settings-root .card-title {
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 20px;
                color: var(--set-text);
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .hr-settings-root .card-title i { color: var(--set-primary); font-size: 20px; }

            .hr-settings-root .form-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
                margin-bottom: 16px;
            }

            .hr-settings-root label {
                font-size: 13px;
                font-weight: 500;
                color: var(--set-muted);
            }

            .hr-settings-root input[type="text"],
            .hr-settings-root input[type="number"],
            .hr-settings-root input[type="email"] {
                padding: 10px 14px;
                border: 1px solid var(--set-border);
                border-radius: 8px;
                background: var(--bg-main);
                color: var(--set-text);
                font-size: 14px;
                outline: none;
                transition: 0.2s;
            }

            .hr-settings-root input:focus {
                border-color: var(--set-primary);
                box-shadow: 0 0 0 3px rgba(106, 13, 173, 0.1);
            }

            /* Custom Toggle Switch */
            .hr-settings-root .toggle-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }
            .hr-settings-root .toggle-text { display:flex; flex-direction:column; gap:2px; }
            .hr-settings-root .toggle-title { font-size: 14px; font-weight: 500; color: var(--set-text); }
            .hr-settings-root .toggle-desc { font-size: 12px; color: var(--set-muted); }

            .hr-settings-root .switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink:0; }
            .hr-settings-root .switch input { opacity: 0; width: 0; height: 0; }
            .hr-settings-root .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--set-border); transition: .4s; border-radius: 24px; }
            .hr-settings-root .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
            
            .hr-settings-root input:checked + .slider { background: linear-gradient(90deg, var(--set-primary), var(--set-secondary)); }
            .hr-settings-root input:checked + .slider:before { transform: translateX(20px); }

            /* Checkboxes / Radios */
            .hr-settings-root .check-row {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 12px;
                font-size: 14px;
                color: var(--set-text);
            }
            .hr-settings-root input[type="checkbox"], .hr-settings-root input[type="radio"] {
                cursor: pointer; width: 16px; height: 16px; accent-color: var(--set-primary);
            }

            .hr-settings-root .btn-save {
                margin-top: auto;
                padding: 10px 20px;
                background: linear-gradient(90deg, var(--set-primary), var(--set-secondary));
                color: white;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: 0.2s;
                align-self: flex-start;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            .hr-settings-root .btn-save:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(106, 13, 173, 0.2); }

            /* Toast Notification */
            #toast-container {
                position: fixed;
                bottom: 24px;
                right: 24px;
                background: linear-gradient(90deg, var(--set-primary), var(--set-secondary));
                color: white;
                padding: 12px 24px;
                border-radius: 8px;
                font-wheight: 500;
                font-size: 14px;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2);
                transform: translateY(100px);
                opacity: 0;
                transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            #toast-container.show { transform: translateY(0); opacity: 1; }

            .hr-settings-root .role-block { margin-bottom: 20px; }
            .hr-settings-root .role-block-title { font-weight: 600; font-size: 13px; color: var(--set-muted); text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px; }

        </style>

        <div class="hr-settings-root">
            <div class="settings-grid">
                
                <!-- A. General Settings -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-buildings"></i> General Settings</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        <div class="form-group">
                            <label>Company Name</label>
                            <input type="text" required value="EmpTrack Inc.">
                        </div>
                        <div class="form-group">
                            <label>Working Hours Per Day</label>
                            <input type="number" required value="8" min="1" max="24">
                        </div>
                        <div class="form-group">
                            <label>Working Days Per Week</label>
                            <input type="number" required value="5" min="1" max="7">
                        </div>
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

                <!-- B. Attendance Settings -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-calendar-check"></i> Attendance Settings</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        <div class="form-group">
                            <label>Min Progress for Full Attendance (%)</label>
                            <input type="number" required value="70" min="1" max="100">
                        </div>
                        <div class="form-group">
                            <label>Late Check-in Threshold (mins)</label>
                            <input type="number" required value="15" min="0">
                        </div>
                        <div class="toggle-row" style="margin-top:16px;">
                            <div class="toggle-text">
                                <span class="toggle-title">Auto Mark Attendance</span>
                                <span class="toggle-desc">Automatically determine attendance based on tasks</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Daily Summary Emails</span>
                                <span class="toggle-desc">Send end-of-day attendance reports to HR</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

                <!-- C. Notification Settings -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-bell-ringing"></i> Notification Settings</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Task Assignments</span>
                                <span class="toggle-desc">Notify employees when new tasks arrive</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Issue Escalations</span>
                                <span class="toggle-desc">Alert HR team instantly for critical matters</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Leave Requests</span>
                                <span class="toggle-desc">Trigger manager approval notifications</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Weekly Performance</span>
                                <span class="toggle-desc">Summarized automated analytics every Friday</span>
                            </div>
                            <label class="switch"><input type="checkbox"><span class="slider"></span></label>
                        </div>
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

                <!-- D. Email Settings -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-envelope-simple"></i> Email Settings</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        <div class="form-group">
                            <label>SMTP Server</label>
                            <input type="text" required value="smtp.mailtrap.io">
                        </div>
                        <div class="form-group">
                            <label>SMTP Port</label>
                            <input type="number" required value="2525">
                        </div>
                        <div class="form-group">
                            <label>From Email</label>
                            <input type="email" required value="no-reply@emptrack.com">
                        </div>
                        <div class="form-group">
                            <label>From Name</label>
                            <input type="text" required value="EmpTrack System">
                        </div>
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

                <!-- E. Security Settings -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-shield-check"></i> Security Settings</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Two-Factor Auth (2FA)</span>
                                <span class="toggle-desc">Require OTP for all admin accounts</span>
                            </div>
                            <label class="switch"><input type="checkbox"><span class="slider"></span></label>
                        </div>
                        <div class="toggle-row">
                            <div class="toggle-text">
                                <span class="toggle-title">Session Timeout</span>
                                <span class="toggle-desc">Logout inactive users after 30 minutes</span>
                            </div>
                            <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
                        </div>
                        
                        <div style="margin-top:16px;">
                            <label style="display:block; margin-bottom:12px;">Password Policy Requirements:</label>
                            <label class="check-row"><input type="checkbox" checked> Minimum 8 characters</label>
                            <label class="check-row"><input type="checkbox" checked> Uppercase & Lowercase letters</label>
                            <label class="check-row"><input type="checkbox" checked> At least one number</label>
                            <label class="check-row"><input type="checkbox"> At least one special character</label>
                        </div>
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

                <!-- F. User Roles & Permissions -->
                <div class="card">
                    <div class="card-title"><i class="ph-fill ph-users"></i> User Roles & Permissions</div>
                    <form onsubmit="event.preventDefault(); window.escSaveSettings(this);">
                        
                        <div class="role-block">
                            <div class="role-block-title">Employee Role</div>
                            <label class="check-row"><input type="radio" name="empRole" checked> View assigned tasks</label>
                            <label class="check-row"><input type="radio" name="empRole"> Report issues</label>
                            <label class="check-row"><input type="radio" name="empRole"> Log work hours</label>
                            <label class="check-row"><input type="radio" name="empRole"> Request leave</label>
                        </div>
                        
                        <div class="role-block">
                            <div class="role-block-title">Team Lead Role</div>
                            <label class="check-row"><input type="checkbox" checked> Assign tasks</label>
                            <label class="check-row"><input type="checkbox" checked> Manage escalations</label>
                            <label class="check-row"><input type="checkbox" checked> Monitor team work</label>
                            <label class="check-row"><input type="checkbox"> View reports</label>
                        </div>

                        <div class="role-block" style="margin-bottom:0;">
                            <div class="role-block-title">HR/Admin Role</div>
                            <label class="check-row"><input type="checkbox" checked disabled> Manage employees</label>
                            <label class="check-row"><input type="checkbox" checked disabled> View reports</label>
                            <label class="check-row"><input type="checkbox" checked disabled> Approve leave</label>
                            <label class="check-row"><input type="checkbox" checked disabled> System settings</label>
                        </div>
                        
                        <br>
                        <button type="submit" class="btn-save"><i class="ph ph-floppy-disk"></i> Save Changes</button>
                    </form>
                </div>

            </div>
        </div>

        <div id="toast-container"><i class="ph-fill ph-check-circle"></i> Settings saved successfully!</div>
    `;

    // Internal Global Method for Toast
    window.escSaveSettings = function(form) {
        if(!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const btn = form.querySelector('.btn-save');
        const ogText = btn.innerHTML;
        btn.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Saving...';
        btn.disabled = true;

        setTimeout(() => {
            btn.innerHTML = ogText;
            btn.disabled = false;
            
            const toast = document.getElementById('toast-container');
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }, 500); // Simulate network latency
    };
}
