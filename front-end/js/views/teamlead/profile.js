// /js/views/teamlead/profile.js

export function renderTeamLeadProfile(container) {
    // Update Page Title natively
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
        titleEl.textContent = 'My Profile';
    }

    const userData = {
        name: 'Rinku Singh',
        role: 'Team Lead – Engineering',
        exp: '6 years experience',
        managing: 'Managing 8 members',
        joined: 'Joined: 2023-03-10',
        empId: 'TL-001',
        email: 'rinku.singh@company.com',
        phone: '+1 (555) 234-5678',
        address: '456 Leadership Ave, San Francisco',
        dept: 'Engineering',
        reportsTo: 'HR Manager'
    };

    const skills = [
        'Team Management', 'React', 'TypeScript', 
        'System Design', 'Agile/Scrum', 'Mentoring', 
        'Project Planning', 'Conflict Resolution'
    ];

    container.innerHTML = `
        <div style="display:flex; flex-direction:column; gap:var(--spacing-xl); max-width: 1440px; margin: 0 auto; animation: fade-in 0.4s ease-out;">
            
            <!-- SECTION 1: Top Profile Overview Card -->
            <div style="background: linear-gradient(135deg, #4C0B9E 0%, #6A11CB 100%); border-radius: var(--radius-xl); box-shadow: 0 10px 30px rgba(106, 17, 203, 0.2); position: relative; overflow: hidden; padding: var(--spacing-xxl) var(--spacing-xl); color: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--spacing-xl);">
                <!-- Decorative BG Overlay -->
                <div style="position: absolute; right: -50px; top: -50px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(255, 75, 145, 0.2) 0%, rgba(255,255,255,0) 70%); border-radius: 50%; pointer-events: none;"></div>
                
                <div style="display: flex; align-items: center; gap: var(--spacing-lg); z-index: 1;">
                    <div style="width: 100px; height: 100px; border-radius: 50%; background-color: rgba(255,255,255,0.1); border: 4px solid rgba(255,255,255,0.3); display:flex; align-items:center; justify-content:center; font-size: 2.5rem; font-weight: bold; box-shadow: 0 8px 20px rgba(0,0,0,0.2);">
                        RS
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        <h2 style="margin: 0; font-size: 2rem; font-weight: var(--font-bold);">${userData.name}</h2>
                        <span style="font-size: var(--text-base); color: rgba(255,255,255,0.85); font-weight: var(--font-medium);">${userData.role}</span>
                        <div style="display: flex; gap: var(--spacing-md); margin-top: 8px;">
                            <button class="hover-btn-white" style="background: white; color: #6A11CB; border: none; padding: 8px 16px; border-radius: var(--radius-md); font-family: var(--font-family); font-weight: var(--font-semibold); cursor: pointer; display: flex; align-items: center; gap: 6px; transition: transform 0.2s ease;">
                                <i class="ph ph-pencil-simple"></i> Edit Profile
                            </button>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: var(--spacing-lg); z-index: 1; flex-wrap: wrap;">
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.15); padding: 12px 20px; border-radius: var(--radius-lg); backdrop-filter: blur(4px);">
                        <i class="ph ph-briefcase" style="font-size: 1.5rem; margin-bottom: 4px; color: rgba(255,255,255,0.9);"></i>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-semibold);">${userData.exp}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.15); padding: 12px 20px; border-radius: var(--radius-lg); backdrop-filter: blur(4px);">
                        <i class="ph ph-users" style="font-size: 1.5rem; margin-bottom: 4px; color: rgba(255,255,255,0.9);"></i>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-semibold);">${userData.managing}</span>
                    </div>
                    <div style="display: flex; flex-direction: column; align-items: center; background: rgba(0,0,0,0.15); padding: 12px 20px; border-radius: var(--radius-lg); backdrop-filter: blur(4px);">
                        <i class="ph ph-calendar-check" style="font-size: 1.5rem; margin-bottom: 4px; color: rgba(255,255,255,0.9);"></i>
                        <span style="font-size: var(--text-sm); font-weight: var(--font-semibold);">${userData.joined}</span>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: Top Stats Row -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg);">
                <div class="stat-bounce" style="background: white; border-radius: var(--radius-xl); padding: var(--spacing-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: var(--spacing-lg); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default;">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(106, 17, 203, 0.1); color: #6A11CB; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="ph-fill ph-rocket"></i>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Projects Led</p>
                        <h3 style="margin: 4px 0 0 0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">12</h3>
                    </div>
                </div>

                <div class="stat-bounce" style="background: white; border-radius: var(--radius-xl); padding: var(--spacing-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: var(--spacing-lg); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default;">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(106, 17, 203, 0.1); color: #6A11CB; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="ph-fill ph-star"></i>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Team Satisfaction</p>
                        <h3 style="margin: 4px 0 0 0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">4.7<span style="font-size:1rem; color:var(--text-muted);">/5</span></h3>
                    </div>
                </div>

                <div class="stat-bounce" style="background: white; border-radius: var(--radius-xl); padding: var(--spacing-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); display: flex; align-items: center; gap: var(--spacing-lg); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor: default;">
                    <div style="width: 50px; height: 50px; border-radius: 12px; background: rgba(106, 17, 203, 0.1); color: #6A11CB; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                        <i class="ph-fill ph-shield-warning"></i>
                    </div>
                    <div>
                        <p style="margin: 0; font-size: var(--text-sm); color: var(--text-muted); font-weight: var(--font-medium);">Escalations Handled</p>
                        <h3 style="margin: 4px 0 0 0; font-size: var(--text-3xl); font-weight: var(--font-bold); color: var(--text-main);">23</h3>
                    </div>
                </div>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: var(--spacing-xl);">
                <!-- Main Content Left Column -->
                <div style="flex: 1 1 65%; min-width: 320px; display: flex; flex-direction: column; gap: var(--spacing-xl);">
                    
                    <!-- SECTION 3: Information Split -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-lg);">
                        
                        <!-- Personal Info -->
                        <div class="info-card" style="background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); padding: var(--spacing-xl); position: relative; overflow: hidden; transition: transform 0.2s ease;">
                            <div style="position:absolute; top:0; left:0; width:4px; height:100%; background: #6A11CB;"></div>
                            <h3 style="margin: 0 0 var(--spacing-lg) 0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); display:flex; align-items:center; gap:8px;">
                                <i class="ph-fill ph-user" style="color:#6A11CB;"></i> Personal Information
                            </h3>
                            <div style="display:flex; flex-direction:column; gap: var(--spacing-md);">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Employee ID</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.empId}</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Email Address</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.email}</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Phone Number</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.phone}</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Home Address</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.address}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Work Info -->
                        <div class="info-card" style="background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); padding: var(--spacing-xl); position: relative; overflow: hidden; transition: transform 0.2s ease;">
                            <div style="position:absolute; top:0; left:0; width:4px; height:100%; background: #FF4B91;"></div>
                            <h3 style="margin: 0 0 var(--spacing-lg) 0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main); display:flex; align-items:center; gap:8px;">
                                <i class="ph-fill ph-buildings" style="color:#FF4B91;"></i> Work Information
                            </h3>
                            <div style="display:flex; flex-direction:column; gap: var(--spacing-md);">
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Department</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.dept}</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Role / Position</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.role.split('–')[0].trim()}</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Team Size</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.managing.split(' ')[1]} members</span>
                                </div>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-size: 12px; color: var(--text-muted); font-weight: var(--font-semibold); text-transform: uppercase;">Reporting To</span>
                                    <span style="font-size: var(--text-base); color: var(--text-main); font-weight: var(--font-medium);">${userData.reportsTo}</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- SECTION 4: Skills & Expertise -->
                    <div style="background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); padding: var(--spacing-xl);">
                        <h3 style="margin: 0 0 var(--spacing-lg) 0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Skills & Expertise</h3>
                        <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                            ${skills.map(s => `<span class="skill-pill hover-pill" style="background: linear-gradient(135deg, #6A11CB 0%, #852DE0 100%); color: white; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-medium); box-shadow: 0 3px 8px rgba(106, 17, 203, 0.2); transition: transform 0.2s ease; cursor: default;">${s}</span>`).join('')}
                        </div>
                    </div>

                    <!-- SECTION 5: Leadership Performance Mini-cards -->
                    <div style="background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); padding: var(--spacing-xl);">
                        <h3 style="margin: 0 0 var(--spacing-lg) 0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Leadership Performance Overview</h3>
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--spacing-md);">
                            
                            <div style="background: var(--bg-surface); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-light); display:flex; flex-direction:column; align-items:flex-start;">
                                <span style="font-size: 20px; color: var(--text-muted); margin-bottom: 4px;"><i class="ph-fill ph-users-three"></i></span>
                                <span style="font-size: 13px; color: var(--text-muted); font-weight: var(--font-medium);">Team Members</span>
                                <div style="display:flex; align-items:baseline; gap: 6px; margin-top:2px;">
                                    <span style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-main);">8</span>
                                    <span style="font-size: 12px; font-weight: var(--font-bold); color: var(--secondary-color);">+2 new</span>
                                </div>
                            </div>

                            <div style="background: var(--bg-surface); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-light); display:flex; flex-direction:column; align-items:flex-start;">
                                <span style="font-size: 20px; color: var(--text-muted); margin-bottom: 4px;"><i class="ph-fill ph-lightning"></i></span>
                                <span style="font-size: 13px; color: var(--text-muted); font-weight: var(--font-medium);">Team Efficiency</span>
                                <div style="display:flex; align-items:baseline; gap: 6px; margin-top:2px;">
                                    <span style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-main);">92%</span>
                                    <span style="font-size: 12px; font-weight: var(--font-bold); color: var(--secondary-color);">+8%</span>
                                </div>
                            </div>

                            <div style="background: var(--bg-surface); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-light); display:flex; flex-direction:column; align-items:flex-start;">
                                <span style="font-size: 20px; color: var(--text-muted); margin-bottom: 4px;"><i class="ph-fill ph-check-square-offset"></i></span>
                                <span style="font-size: 13px; color: var(--text-muted); font-weight: var(--font-medium);">Tasks Supervised</span>
                                <div style="display:flex; align-items:baseline; gap: 6px; margin-top:2px;">
                                    <span style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-main);">245</span>
                                    <span style="font-size: 12px; font-weight: var(--font-bold); color: var(--secondary-color);">+15%</span>
                                </div>
                            </div>

                            <div style="background: var(--bg-surface); padding: var(--spacing-md); border-radius: var(--radius-lg); border: 1px solid var(--border-light); display:flex; flex-direction:column; align-items:flex-start;">
                                <span style="font-size: 20px; color: var(--text-muted); margin-bottom: 4px;"><i class="ph-fill ph-shield-check"></i></span>
                                <span style="font-size: 13px; color: var(--text-muted); font-weight: var(--font-medium);">Issue Resolution</span>
                                <div style="display:flex; align-items:baseline; gap: 6px; margin-top:2px;">
                                    <span style="font-size: var(--text-xl); font-weight: var(--font-bold); color: var(--text-main);">96%</span>
                                    <span style="font-size: 12px; font-weight: var(--font-bold); color: var(--secondary-color);">+4%</span>
                                </div>
                            </div>

                        </div>
                    </div>

                </div>

                <!-- Right Sidebar Column (Security / Password Change) -->
                <div style="flex: 1 1 30%; min-width: 300px; display: flex; flex-direction: column;">
                    <div style="background: white; border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); border: 1px solid var(--border-light); padding: var(--spacing-xl); display: flex; flex-direction: column; gap: var(--spacing-lg);">
                        
                        <div style="display:flex; align-items:center; gap:10px;">
                            <div style="width: 40px; height: 40px; border-radius: 12px; background: rgba(106, 17, 203, 0.1); color: #6A11CB; display:flex; align-items:center; justify-content:center; font-size: 1.25rem;">
                                <i class="ph-fill ph-lock-key"></i>
                            </div>
                            <h3 style="margin: 0; font-size: var(--text-lg); font-weight: var(--font-bold); color: var(--text-main);">Security Settings</h3>
                        </div>

                        <p style="margin: 0; font-size: var(--text-sm); color: var(--text-muted);">Ensure your account uses a long, random password to stay secure.</p>

                        <form id="password-form" style="display: flex; flex-direction: column; gap: var(--spacing-md); margin-top: 8px;">
                            
                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">Current Password</label>
                                <input type="password" id="current-pwd" placeholder="Enter current password" required class="custom-input" style="padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: var(--font-family); font-size: var(--text-sm); outline: none;">
                            </div>

                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">New Password</label>
                                <input type="password" id="new-pwd" placeholder="Enter new password" required class="custom-input" style="padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: var(--font-family); font-size: var(--text-sm); outline: none;">
                            </div>

                            <div style="display:flex; flex-direction:column; gap:6px;">
                                <label style="font-size: var(--text-sm); font-weight: var(--font-medium); color: var(--text-main);">Confirm New Password</label>
                                <input type="password" id="confirm-pwd" placeholder="Re-type new password" required class="custom-input" style="padding: 12px 14px; border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: var(--font-family); font-size: var(--text-sm); outline: none;">
                                <span id="pwd-error-msg" style="color: var(--danger-color); font-size: 12px; display:none; margin-top: 4px;"><i class="ph-fill ph-warning-circle"></i> Passwords do not match.</span>
                            </div>

                            <button type="submit" id="update-pwd-btn" style="margin-top: 10px; background: linear-gradient(135deg, #6A11CB 0%, #FF4B91 100%); color: white; border: none; padding: 14px; border-radius: var(--radius-md); font-family: var(--font-family); font-weight: var(--font-semibold); font-size: var(--text-base); cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; display:flex; align-items:center; justify-content:center; gap: 8px;">
                                <i class="ph ph-check-circle" style="font-size: 1.2rem;"></i> Update Password
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </div>

        <!-- Local Toast Notification Area -->
        <div id="profile-toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 1000; display:flex; flex-direction:column; gap:10px;"></div>

        <style>
            @keyframes fade-in {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            @keyframes slide-in {
                from { opacity: 0; transform: translateX(100%); }
                to { opacity: 1; transform: translateX(0); }
            }
            .stat-bounce:hover { transform: translateY(-4px); box-shadow: var(--shadow-md); border-color: rgba(106, 17, 203, 0.2); }
            .info-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
            .hover-pill:hover { transform: scale(1.05); filter: brightness(1.1); }
            .hover-btn-white:hover { transform: scale(1.02); box-shadow: 0 4px 15px rgba(255,255,255,0.3); }
            
            #update-pwd-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(106, 17, 203, 0.3); filter: brightness(1.1); }
            #update-pwd-btn:active { transform: scale(0.98); }

            .custom-input:focus { border-color: #6A11CB !important; box-shadow: 0 0 0 3px rgba(106, 17, 203, 0.1) !important; }
        </style>
    `;

    // Interactive Form Validation Logic
    const pwdForm = document.getElementById('password-form');
    const newPwdObj = document.getElementById('new-pwd');
    const confirmPwdObj = document.getElementById('confirm-pwd');
    const errorMsg = document.getElementById('pwd-error-msg');

    if (pwdForm) {
        pwdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';
            newPwdObj.style.borderColor = 'var(--border-color)';
            confirmPwdObj.style.borderColor = 'var(--border-color)';

            const currentVal = document.getElementById('current-pwd').value;
            const newVal = newPwdObj.value;
            const confirmVal = confirmPwdObj.value;

            if (newVal !== confirmVal) {
                // Passwords mismatch visual cues
                errorMsg.style.display = 'flex';
                errorMsg.style.alignItems = 'center';
                errorMsg.style.gap = '4px';
                newPwdObj.style.borderColor = 'var(--danger-color)';
                confirmPwdObj.style.borderColor = 'var(--danger-color)';
                
                // Jiggle animation on inputs
                newPwdObj.animate([ { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' } ], { duration: 300 });
                confirmPwdObj.animate([ { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' } ], { duration: 300 });
                
                showProfileToast('Verification Failed', 'The new passwords do not match. Please try again.', 'error');
                return;
            }

            // Success logic
            showProfileToast('Security Updated', 'Your password has been successfully updated.', 'success');
            pwdForm.reset();
        });
    }

    function showProfileToast(title, message, type = 'success') {
        const toastContainer = document.getElementById('profile-toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const iconColor = type === 'success' ? '#10B981' : '#EF4444';
        const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-warning-octagon';

        toast.style.cssText = `
            background: white; 
            border-left: 4px solid ${iconColor}; 
            box-shadow: 0 8px 25px rgba(0,0,0,0.15); 
            padding: 16px; 
            border-radius: 8px; 
            display:flex; 
            align-items:flex-start; 
            gap: 12px; 
            animation: slide-in 0.3s ease-out forwards;
            min-width: 250px;
        `;

        toast.innerHTML = `
            <i class="ph-fill ${iconClass}" style="color: ${iconColor}; font-size: 1.5rem; flex-shrink:0;"></i>
            <div>
                <h4 style="margin:0; font-size: 14px; font-weight: 600; color: var(--text-main);">${title}</h4>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">${message}</p>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after 3.5 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
}
