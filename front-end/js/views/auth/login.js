// /js/views/auth/login.js
import { auth } from '../../auth.js';

export function renderLoginView(container) {
    container.innerHTML = `
        <div class="auth-wrapper">
            <div class="auth-container">
                <div class="auth-logo">
                    <i class="ph-fill ph-check-circle" style="font-size:36px;"></i> EmpTrack
                </div>
                <h2 class="auth-title">Sign In to Your Portal</h2>
                
                <form id="login-form">
                    <div class="form-group" id="group-email">
                        <label class="form-label" for="email">Work Email</label>
                        <input type="email" id="email" class="form-control" placeholder="e.g. emp@emp.com" autocomplete="email">
                        <div class="form-error"></div>
                    </div>
                    
                    <div class="form-group" id="group-password">
                        <label class="form-label" for="password">Password</label>
                        <input type="password" id="password" class="form-control" placeholder="••••••••" autocomplete="current-password">
                        <div class="form-error"></div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
                        Login <i class="ph ph-arrow-right"></i>
                    </button>
                    
                    <div id="login-alert" class="form-error" style="text-align:center; margin-top:16px;"></div>
                </form>
            </div>
        </div>
    `;

    const form = document.getElementById('login-form');
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
                // Change hash to let Router handle transition cleanly
                window.location.hash = '#dashboard';
            } else {
                alertBox.textContent = result.message;
                alertBox.style.display = 'block';
            }
        }
    });
}
