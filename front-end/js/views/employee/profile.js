// /js/views/employee/profile.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderEmployeeProfile(container) {
    const session = auth.getCurrentUser();
    const user = db.getUserById(session.emp_id);
    
    // Header
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight:var(--font-bold); font-size:var(--text-xl);">My Profile</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Employee Portal</span>
            </div>
        </div>
    `;

    // Skills payload manually mapped
    const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'GraphQL'];

    // HR Data
    const manager = db.getUserById(user.manager_id);
    const joinedStr = new Date(user.date_of_joining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    container.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; display:flex; flex-direction:column; gap: 32px; padding-bottom: 40px;">
            
            <!-- SECTION 1: PROFILE HEADER CARD -->
            <div class="profile-hero">
                <div style="display:flex; align-items:center; gap: 24px; flex-wrap:wrap;">
                    <div class="profile-avatar-ph">
                        <i class="ph-fill ph-user"></i>
                    </div>
                    <div style="display:flex; flex-direction:column; gap: 8px;">
                        <h2 style="margin:0; font-size: 28px; font-weight:var(--font-bold);">${user.emp_name}</h2>
                        <div style="font-size: 18px; opacity: 0.9;">Software Engineer</div>
                        <div style="display:flex; gap: 20px; margin-top: 8px; font-size: 14px; opacity: 0.8; flex-wrap:wrap;">
                            <div style="display:flex; align-items:center; gap: 6px;"><i class="ph ph-briefcase"></i> Engineering Dept (${user.department_id})</div>
                            <div style="display:flex; align-items:center; gap: 6px;"><i class="ph ph-calendar-blank"></i> Joined ${joinedStr}</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- SECTION 2: PERSONAL & WORK INFORMATION -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px;">
                
                <!-- Personal -->
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 20px 0; font-size:var(--text-lg); border-bottom:1px solid var(--border-light); padding-bottom:12px;">Personal Information</h3>
                    
                    <div style="display:flex; flex-direction:column; gap: 16px;">
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; display:flex; align-items:center; gap: 12px;">
                            <div style="color:var(--primary-color); font-size:20px;"><i class="ph-fill ph-identification-badge"></i></div>
                            <div>
                                <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Employee ID</div>
                                <div style="font-weight:var(--font-medium);">${user.emp_id}</div>
                            </div>
                        </div>
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; display:flex; align-items:center; gap: 12px;">
                            <div style="color:var(--primary-color); font-size:20px;"><i class="ph-fill ph-envelope-simple"></i></div>
                            <div>
                                <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Email Address</div>
                                <div style="font-weight:var(--font-medium);">${user.email}</div>
                            </div>
                        </div>
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px; display:flex; align-items:center; gap: 12px;">
                            <div style="color:var(--primary-color); font-size:20px;"><i class="ph-fill ph-phone"></i></div>
                            <div>
                                <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Phone Number</div>
                                <div style="font-weight:var(--font-medium);">+1 (${user.phone.slice(0,3)}) ${user.phone.slice(3,6)}-${user.phone.slice(6,10)}</div>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap: 12px;">
                            <div style="color:var(--primary-color); font-size:20px;"><i class="ph-fill ph-map-pin"></i></div>
                            <div>
                                <div style="font-size:12px; color:var(--text-muted); margin-bottom:2px;">Address</div>
                                <div style="font-weight:var(--font-medium);">123 Innovation Drive, Tech Park Zone, CA 94016</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Work -->
                <div class="card" style="padding: 24px;">
                    <h3 style="margin:0 0 20px 0; font-size:var(--text-lg); border-bottom:1px solid var(--border-light); padding-bottom:12px;">Work Information</h3>
                    
                    <div style="display:flex; flex-direction:column; gap: 16px;">
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px;">
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Department</div>
                            <div style="font-weight:var(--font-bold); color: #334155;">Engineering</div>
                        </div>
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px;">
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Role</div>
                            <div style="font-weight:var(--font-bold); color: #334155;">Software Engineer</div>
                        </div>
                        <div style="border-bottom: 1px solid #F1F5F9; padding-bottom: 12px;">
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Direct Manager</div>
                            <div style="font-weight:var(--font-bold); color: #334155;">${manager ? manager.emp_name : 'N/A'}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:var(--text-muted); margin-bottom:4px;">Reporting To</div>
                            <div style="font-weight:var(--font-bold); color: #334155;">Team Lead - Engineering (${user.team_id})</div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- SECTION 3: SKILLS & EXPERTISE -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 20px 0; font-size:var(--text-lg);">Skills & Expertise</h3>
                <div style="display:flex; flex-wrap:wrap; gap: 12px;">
                    ${skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </div>

            <!-- SECTION 4: PERFORMANCE OVERVIEW -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium); margin-bottom:8px;">Tasks Completed</div>
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">142</div>
                    <div class="text-success" style="font-size: 13px; font-weight:var(--font-bold);"><i class="ph-bold ph-trend-up"></i> +12%</div>
                </div>
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium); margin-bottom:8px;">Avg. Task Rating</div>
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">4.8/5</div>
                    <div class="text-success" style="font-size: 13px; font-weight:var(--font-bold);"><i class="ph-bold ph-trend-up"></i> +0.3</div>
                </div>
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium); margin-bottom:8px;">On-Time Delivery</div>
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">94%</div>
                    <div class="text-success" style="font-size: 13px; font-weight:var(--font-bold);"><i class="ph-bold ph-trend-up"></i> +5%</div>
                </div>
                <div class="card" style="padding: 24px; text-align:center;">
                    <div style="font-size:13px; color:var(--text-muted); font-weight:var(--font-medium); margin-bottom:8px;">Attendance Rate</div>
                    <div style="font-size: 36px; font-weight: var(--font-bold); color: var(--text-main); margin-bottom:4px;">96%</div>
                    <div class="text-success" style="font-size: 13px; font-weight:var(--font-bold);"><i class="ph-bold ph-trend-up"></i> +2%</div>
                </div>
            </div>

            <!-- SECTION 5: CHANGE PASSWORD -->
            <div class="card" style="padding: 24px;">
                <h3 style="margin:0 0 24px 0; font-size:var(--text-lg); border-bottom:1px solid var(--border-light); padding-bottom:16px;">Change Password</h3>
                <form id="password-form">
                    
                    <div class="form-group" style="max-width: 400px; margin-bottom: 24px;">
                        <label class="form-label">Current Password</label>
                        <input type="password" id="current_pw" class="form-control" placeholder="Enter current password" required style="border-radius: var(--radius-md); padding: 12px 16px;">
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 24px;">
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">New Password</label>
                            <input type="password" id="new_pw" class="form-control" placeholder="Enter new password" required minlength="6" style="border-radius: var(--radius-md); padding: 12px 16px;">
                        </div>
                        <div class="form-group" style="margin:0;">
                            <label class="form-label">Confirm New Password</label>
                            <input type="password" id="confirm_pw" class="form-control" placeholder="Confirm new password" required minlength="6" style="border-radius: var(--radius-md); padding: 12px 16px;">
                            <div id="pw_error" style="color:var(--danger-color); font-size:12px; margin-top:6px; display:none;">Passwords do not match!</div>
                        </div>
                    </div>

                    <!-- Action -->
                    <button type="submit" class="btn btn-purple" style="padding: 14px 32px; font-size:var(--text-md); display:flex; justify-content:center; align-items:center; gap:10px; border-radius: 50px;">
                        Update Password
                    </button>
                    <div id="pw_success" style="color:#10B981; font-weight:var(--font-medium); font-size:13px; margin-top:16px; display:none;">
                        <i class="ph-fill ph-check-circle"></i> Password updated successfully!
                    </div>
                </form>
            </div>

        </div>
    `;

    // Internal Form Binding
    document.getElementById('password-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentField = document.getElementById('current_pw');
        const newField = document.getElementById('new_pw');
        const countField = document.getElementById('confirm_pw');
        
        const errNode = document.getElementById('pw_error');
        const sucNode = document.getElementById('pw_success');

        errNode.style.display = 'none';
        sucNode.style.display = 'none';

        // Basic Math constraint validation
        if (newField.value !== countField.value) {
            errNode.style.display = 'block';
            countField.style.borderColor = 'var(--danger-color)';
            return;
        }

        // Simulating Backend Accept state natively
        currentField.value = '';
        newField.value = '';
        countField.value = '';
        countField.style.borderColor = 'var(--border-color)';
        
        sucNode.style.display = 'block';
        setTimeout(() => {
            sucNode.style.display = 'none';
        }, 4000); // UI decay organically mimicking 4 seconds.
    });
}
