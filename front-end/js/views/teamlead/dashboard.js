// /js/views/teamlead/dashboard.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded by app.js
    
    const nameEl = document.getElementById('tl-name');
    if (nameEl) nameEl.textContent = user.emp_name.split(' ')[0];

    // Added approval/rejection logic implementation from previous conversational design
    const toastContainer = document.getElementById('toast-container');
    const showToast = (message, type = 'success') => {
        const toast = document.createElement('div');
        toast.style.cssText = `
            background:${type === 'success' ? '#16A34A' : '#DC2626'};
            color:white;
            padding:12px 20px;
            border-radius:8px;
            font-weight:500;
            box-shadow:0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.innerHTML = message;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    document.querySelectorAll('.btn-approve').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.tl-approval-card');
            if (card) {
                card.remove();
                showToast("Request Approved", "success");
            }
        });
    });

    document.querySelectorAll('.btn-reject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.tl-approval-card');
            if (card) {
                card.remove();
                showToast("Request Rejected", "danger");
            }
        });
    });
});
