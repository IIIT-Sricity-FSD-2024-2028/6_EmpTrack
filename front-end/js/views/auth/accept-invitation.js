// /js/views/auth/accept-invitation.js
import { db } from '../../store.js';
import { theme } from '../../theme.js';

document.addEventListener('DOMContentLoaded', async () => {
    theme.bindToggleButton(document.getElementById('theme-toggle-btn'));

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    const stateLoading = document.getElementById('state-loading');
    const stateInvalid = document.getElementById('state-invalid');
    const stateForm = document.getElementById('state-form');
    const stateSuccess = document.getElementById('state-success');

    function showState(state) {
        [stateLoading, stateInvalid, stateForm, stateSuccess].forEach((el) => { el.style.display = 'none'; });
        state.style.display = 'block';
    }

    if (!token) {
        document.getElementById('invalid-message').textContent = 'No invitation token was provided.';
        showState(stateInvalid);
        return;
    }

    let invitation;
    try {
        invitation = await db.getInvitationByToken(token);
    } catch (e) {
        document.getElementById('invalid-message').textContent = e.message || 'This invitation link is invalid or has expired.';
        showState(stateInvalid);
        return;
    }

    const roleLabel = invitation.role === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'Company Admin';
    document.getElementById('invite-summary').textContent = `${invitation.name}, you've been invited to join as ${roleLabel}. Set a password to activate your account.`;
    document.getElementById('invite-email').value = invitation.email;
    showState(stateForm);

    document.getElementById('accept-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const alertEl = document.getElementById('accept-alert');
        alertEl.style.display = 'none';

        if (password.length < 8) {
            alertEl.textContent = 'Password must be at least 8 characters.';
            alertEl.style.display = 'block';
            return;
        }
        if (password !== confirmPassword) {
            alertEl.textContent = 'Passwords do not match.';
            alertEl.style.display = 'block';
            return;
        }

        try {
            await db.acceptInvitation(token, password);
            showState(stateSuccess);
            setTimeout(() => { window.location.href = 'login.html'; }, 2500);
        } catch (err) {
            alertEl.textContent = err.message || 'Failed to activate account.';
            alertEl.style.display = 'block';
        }
    });
});
