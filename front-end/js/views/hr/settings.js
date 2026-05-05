// /js/views/hr/settings.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

    const forms = document.querySelectorAll('.settings-form');
    forms.forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
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
        });
    });
});
