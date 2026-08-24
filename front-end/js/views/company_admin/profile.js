// /js/views/company_admin/profile.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    // Password eye toggles
    document.querySelectorAll('.eye-icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const input = icon.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('ph-eye', 'ph-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('ph-eye-slash', 'ph-eye');
            }
        });
    });

    // Real password update via the backend - no more fake alert().
    const pwdForm = document.getElementById('password-form');
    const currentPwd = document.getElementById('currentPwd');
    const newPwd = document.getElementById('newPwd');
    const confPwd = document.getElementById('confPwd');
    const pwdErr = document.getElementById('pwdErr');
    const btnUpdatePwd = document.getElementById('btnUpdatePwd');

    if (pwdForm) {
        pwdForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            pwdErr.style.display = 'none';

            if (newPwd.value !== confPwd.value) {
                pwdErr.textContent = 'Passwords do not match.';
                pwdErr.style.display = 'block';
                return;
            }

            const ogText = btnUpdatePwd.innerHTML;
            btnUpdatePwd.innerHTML = '<i class="ph ph-spinner ph-spin" style="font-size:1.2rem;"></i> Updating...';
            btnUpdatePwd.disabled = true;

            try {
                await db.updateUserPassword(user.emp_id, currentPwd.value, newPwd.value, confPwd.value);
                pwdForm.reset();
                const toast = document.getElementById('prof-toast');
                toast.classList.add('show');
                setTimeout(() => toast.classList.remove('show'), 3000);
            } catch (err) {
                pwdErr.textContent = err.message || 'Failed to update password.';
                pwdErr.style.display = 'block';
            } finally {
                btnUpdatePwd.innerHTML = ogText;
                btnUpdatePwd.disabled = false;
            }
        });
    }
});
