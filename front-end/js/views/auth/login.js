// /js/views/auth/login.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    // Feature disabled: Let users see the login page to switch accounts or verify navigation
    // if (auth.isAuthenticated()) {
    //     const role = auth.getRole();
    //     window.location.href = `/front-end/${role.toLowerCase()}/dashboard.html`;
    //     return;
    // }

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passInput = document.getElementById('password');
            const alertBox = document.getElementById('login-alert');

            // Simple Reset
            emailInput.classList.remove('is-invalid');
            passInput.classList.remove('is-invalid');
            alertBox.style.display = 'none';

            const email = emailInput.value.trim();
            const pwd = passInput.value;
            let isValid = true;

            if (!email) {
                emailInput.classList.add('is-invalid');
                emailInput.nextElementSibling.textContent = 'Email is required';
                isValid = false;
            }
            
            if (!pwd) {
                passInput.classList.add('is-invalid');
                passInput.nextElementSibling.textContent = 'Password is required';
                isValid = false;
            }

            if (isValid) {
                const result = auth.login(email, pwd);
                if (result.success) {
                    const role = auth.getRole();
                    window.location.href = `/front-end/${role.toLowerCase()}/dashboard.html`;
                } else {
                    alertBox.textContent = result.message;
                    alertBox.style.display = 'block';
                }
            }
        });
    }
});
