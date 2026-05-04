// /js/views/teamlead/profile.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

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

    document.getElementById('profile-name').textContent = userData.name;
    document.getElementById('profile-role').textContent = userData.role;
    document.getElementById('profile-exp').textContent = userData.exp;
    document.getElementById('profile-managing').textContent = userData.managing;
    document.getElementById('profile-joined').textContent = userData.joined;
    
    document.getElementById('profile-empId').textContent = userData.empId;
    document.getElementById('profile-email').textContent = userData.email;
    document.getElementById('profile-phone').textContent = userData.phone;
    document.getElementById('profile-address').textContent = userData.address;
    
    document.getElementById('profile-dept').textContent = userData.dept;
    document.getElementById('profile-position').textContent = userData.role.split('–')[0].trim();
    document.getElementById('profile-teamsize').textContent = userData.managing.split(' ')[1] + ' members';
    document.getElementById('profile-reportsto').textContent = userData.reportsTo;

    const initials = userData.name.split(' ').map(n => n[0]).join('');
    document.getElementById('profile-initials').textContent = initials;

    const skillsContainer = document.getElementById('skills-container');
    if (skillsContainer) {
        skillsContainer.innerHTML = skills.map(s => `<span class="skill-pill hover-pill" style="background: linear-gradient(135deg, #6A11CB 0%, #852DE0 100%); color: white; padding: 6px 16px; border-radius: var(--radius-full); font-size: var(--text-sm); font-weight: var(--font-medium); box-shadow: 0 3px 8px rgba(106, 17, 203, 0.2); transition: transform 0.2s ease; cursor: default;">${s}</span>`).join('');
    }

    // Edit Profile Logic
    const editBtn = document.getElementById('edit-profile-btn');
    const editModal = document.getElementById('edit-profile-modal');
    const closeEditBtn = document.getElementById('close-edit-modal');
    const editForm = document.getElementById('edit-profile-form');
    const editNameInput = document.getElementById('edit-name-input');

    if (editBtn && editModal) {
        editBtn.addEventListener('click', async () => {
            editNameInput.value = userData.name;
            editModal.style.display = 'flex';
        });

        closeEditBtn.addEventListener('click', async () => {
            editModal.style.display = 'none';
        });

        editModal.addEventListener('click', async (e) => {
            if (e.target === editModal) editModal.style.display = 'none';
        });

        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = editNameInput.value.trim();
            if (newName) {
                userData.name = newName;
                document.getElementById('profile-name').textContent = userData.name;
                const newInitials = userData.name.split(' ').map(n => n[0] ? n[0].toUpperCase() : '').join('');
                document.getElementById('profile-initials').textContent = newInitials;
                showProfileToast('Profile Updated', 'Your name has been successfully updated.', 'success');
                editModal.style.display = 'none';
            }
        });
    }

    const pwdForm = document.getElementById('password-form');
    const newPwdObj = document.getElementById('new-pwd');
    const confirmPwdObj = document.getElementById('confirm-pwd');
    const errorMsg = document.getElementById('pwd-error-msg');

    if (pwdForm) {
        pwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMsg.style.display = 'none';
            newPwdObj.style.borderColor = 'var(--border-color)';
            confirmPwdObj.style.borderColor = 'var(--border-color)';

            const newVal = newPwdObj.value;
            const confirmVal = confirmPwdObj.value;

            if (newVal !== confirmVal) {
                errorMsg.style.display = 'flex';
                errorMsg.style.alignItems = 'center';
                errorMsg.style.gap = '4px';
                newPwdObj.style.borderColor = 'var(--danger-color)';
                confirmPwdObj.style.borderColor = 'var(--danger-color)';
                
                newPwdObj.animate([ { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' } ], { duration: 300 });
                confirmPwdObj.animate([ { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-5px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(0)' } ], { duration: 300 });
                
                showProfileToast('Verification Failed', 'The new passwords do not match. Please try again.', 'error');
                return;
            }

            showProfileToast('Security Updated', 'Your password has been successfully updated.', 'success');
            pwdForm.reset();
        });
    }

    async function showProfileToast(title, message, type = 'success') {
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

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-in';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
