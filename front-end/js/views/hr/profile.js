// /js/views/hr/profile.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    // Populate dynamic user info
    const initalsContainer = document.getElementById('avatar-initials');
    if (initalsContainer) {
        initalsContainer.textContent = user.emp_name.charAt(0) + 'S'; // Example
    }
    
    const nameContainer = document.getElementById('profile-name');
    if (nameContainer) nameContainer.textContent = user.emp_name;

    const emailContainer = document.getElementById('info-email');
    if (emailContainer) emailContainer.textContent = user.email || 'user@company.com';

    // Mock specific HR data
    document.getElementById('profile-role').textContent = 'HR Manager - Human Resources';
    document.getElementById('profile-exp').textContent = '8 Years Experience';
    document.getElementById('profile-joined').textContent = 'Joined 2017-06-01';

    // Handle Picture Upload Click
    const uploadBtn = document.getElementById('upload-avatar-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => alert('Upload Photo feature coming soon'));
    }

    // Password Eye Toggles
    const eyeIcons = document.querySelectorAll('.eye-icon');
    eyeIcons.forEach(icon => {
        icon.addEventListener('click', async () => {
            const input = icon.previousElementSibling;
            if(input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('ph-eye', 'ph-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('ph-eye-slash', 'ph-eye');
            }
        });
    });

    // Password Match validation
    const newPwd = document.getElementById('newPwd');
    const confPwd = document.getElementById('confPwd');
    const pwdErr = document.getElementById('pwdErr');
    const btnUpdatePwd = document.getElementById('btnUpdatePwd');

    async function checkMatch() {
        if (!newPwd || !confPwd) return;
        const p1 = newPwd.value;
        const p2 = confPwd.value;
        
        if (p2.length > 0 && p1 !== p2) {
            pwdErr.style.display = 'block';
            btnUpdatePwd.disabled = true;
            btnUpdatePwd.style.opacity = '0.5';
        } else {
            pwdErr.style.display = 'none';
            btnUpdatePwd.disabled = false;
            btnUpdatePwd.style.opacity = '1';
        }
    }

    if (newPwd) newPwd.addEventListener('input', checkMatch);
    if (confPwd) confPwd.addEventListener('input', checkMatch);

    // Submission Form
    const pwdForm = document.getElementById('password-form');
    if (pwdForm) {
        pwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!pwdForm.checkValidity()) { 
                pwdForm.reportValidity(); 
                return; 
            }
            
            const ogText = btnUpdatePwd.innerHTML;
            btnUpdatePwd.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size:1.2rem;"></i> Updating...';
            btnUpdatePwd.disabled = true;

            setTimeout(() => {
                btnUpdatePwd.innerHTML = ogText;
                btnUpdatePwd.disabled = false;
                pwdForm.reset();
                const toast = document.getElementById('prof-toast');
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            }, 600);
        });
    }

});
