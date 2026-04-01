// /js/views/auth/forgot-password.js
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const forgotForm = document.getElementById('forgot-form');
    let resetUser = null;

    if (forgotForm) {
        forgotForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!forgotForm.checkValidity()) {
                forgotForm.reportValidity();
                return;
            }
            
            const submitBtn = document.getElementById('btn-forgot-next');
            const emailField = document.getElementById('reset-email');
            const errField = document.getElementById('reset-email-err');
            
            errField.style.display = 'none';
            emailField.classList.remove('is-invalid');
            
            const userMatch = db.getUserByEmail(emailField.value.trim());
            if (!userMatch) {
                errField.textContent = "We couldn't find an account with that email.";
                errField.style.display = 'block';
                emailField.classList.add('is-invalid');
                return;
            }
            
            resetUser = userMatch;
            
            const ogText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ph-fill ph-spinner ph-spin"></i> Verifying...';
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.innerHTML = ogText;
                submitBtn.disabled = false;
                
                document.getElementById('forgot-step-1').style.display = 'none';
                document.getElementById('forgot-step-2').style.display = 'block';
            }, 600);
        });
    }

    const resetPwdForm = document.getElementById('reset-pwd-form');
    if (resetPwdForm) {
        resetPwdForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!resetPwdForm.checkValidity()) {
                resetPwdForm.reportValidity();
                return;
            }
            
            const pwd1Field = document.getElementById('reset-new-pwd');
            const pwd2Field = document.getElementById('reset-conf-pwd');
            const errField = document.getElementById('reset-pwd-err');
            errField.style.display = 'none';
            pwd1Field.classList.remove('is-invalid');
            pwd2Field.classList.remove('is-invalid');
            
            if (pwd1Field.value !== pwd2Field.value) {
                errField.textContent = "Passwords do not match.";
                errField.style.display = 'block';
                pwd2Field.classList.add('is-invalid');
                return;
            }
            
            const submitBtn = document.getElementById('btn-reset-submit');
            const ogText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="ph-fill ph-spinner ph-spin"></i> Updating...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                db.updateUserPassword(resetUser.emp_id, pwd1Field.value);
                
                submitBtn.innerHTML = ogText;
                submitBtn.disabled = false;
                resetPwdForm.reset();
                forgotForm.reset();
                
                showToast('Password Reset', 'Your password has been successfully updated. Redirecting to login...', 'success');
                
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }, 800);
        });
    }

    function showToast(title, message, type = 'info') {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        const iconColor = type === 'success' ? '#10B981' : '#3B82F6';
        const iconClass = type === 'success' ? 'ph-check-circle' : 'ph-info';

        toast.style.cssText = `background: white; border-left: 4px solid ${iconColor}; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 16px; border-radius: 8px; display:flex; align-items:flex-start; gap: 12px; animation: slideInX 0.3s ease-out forwards; min-width: 250px;`;

        toast.innerHTML = `<i class="ph-fill ${iconClass}" style="color: ${iconColor}; font-size: 1.5rem; flex-shrink:0;"></i><div><h4 style="margin:0; font-size: 14px; font-weight: 600; color: var(--text-main);">${title}</h4><p style="margin: 4px 0 0 0; font-size: 12px; color: var(--text-muted);">${message}</p></div>`;
        toastContainer.appendChild(toast);

        if (!document.getElementById('toast-anim')) {
            const style = document.createElement('style');
            style.id = 'toast-anim';
            style.innerHTML = `@keyframes slideInX { from { transform: translateX(100%); opacity:0; } to { transform: translateX(0); opacity:1; } } @keyframes fadeOutX { to { opacity: 0; transform: translateX(10px); } }`;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            toast.style.animation = 'fadeOutX 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
