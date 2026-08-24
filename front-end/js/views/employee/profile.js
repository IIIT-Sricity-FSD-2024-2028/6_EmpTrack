// /js/views/employee/profile.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const session = auth.getCurrentUser();
    if (!session) return; // Guarded
    const user = await db.getUserById(session.emp_id);
  async function isStrongPassword(password) {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(password);
    }
    // Skills payload
    const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'GraphQL'];

    // HR Data
    const manager = await db.getUserById(user.manager_id);
    const joinedStr = new Date(user.date_of_joining).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Populate DOM
    document.getElementById('prof-name').textContent = user.emp_name;
    document.getElementById('prof-dept').textContent = user.department_id;
    document.getElementById('prof-joined').textContent = joinedStr;

    document.getElementById('prof-id').textContent = user.emp_id;
    document.getElementById('prof-email').textContent = user.email;
    document.getElementById('prof-phone').textContent = `+1 (${user.phone.slice(0,3)}) ${user.phone.slice(3,6)}-${user.phone.slice(6,10)}`;
    
    document.getElementById('prof-manager').textContent = manager ? manager.emp_name : 'N/A';
    Array.from(document.getElementsByClassName('prof-team')).forEach(e => e.textContent = `Team Lead - Engineering (${user.team_id})`);

    const skillsContainer = document.getElementById('prof-skills');
    if (skillsContainer) {
        skillsContainer.innerHTML = skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('');
    }

    // Internal Form Binding
    const pwForm = document.getElementById('password-form');
    if (pwForm) {
        pwForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentField = document.getElementById('current_pw');
            const newField = document.getElementById('new_pw');
            const confirmField = document.getElementById('confirm_pw');
            const errNode = document.getElementById('pw_error');
            const sucNode = document.getElementById('pw_success');

            errNode.style.display = 'none';
            sucNode.style.display = 'none';
  currentField.style.borderColor = 'var(--border-color)';
            newField.style.borderColor = 'var(--border-color)';
    confirmField.style.borderColor = 'var(--border-color)';
       
          
            //  1. Validate current password
            if (currentField.value !== user.password) {
                errNode.textContent = "Incorrect current password!";
                errNode.style.display = 'block';
                currentField.style.borderColor = 'var(--danger-color)';
                return;
            }
          
          
            //  2. Strong password check
            if (!isStrongPassword(newField.value)) {
                errNode.textContent = "Weak password! Use 8+ chars, uppercase, lowercase, number & special character.";
                errNode.style.display = 'block';
                newField.style.borderColor = 'var(--danger-color)';
                return;
            }
          
             //  3. Confirm match
            if (newField.value !== confirmField.value) {
                errNode.textContent = "Passwords do not match!";
                errNode.style.display = 'block';
                confirmField.style.borderColor = 'var(--danger-color)';
                return;
            }
            //  4. Prevent reuse
            if (newField.value === user.password) {
                errNode.textContent = "New password cannot be same as current password!";
                errNode.style.display = 'block';
                return;
            }

            //  5. Update password via the real backend endpoint
            const submitBtn = pwForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'Updating...';
            }

            try {
                await db.updateUserPassword(user.emp_id, currentField.value, newField.value, confirmField.value);
                user.password = newField.value;

                currentField.value = '';
                newField.value = '';
                confirmField.value = '';
                confirmField.style.borderColor = 'var(--border-color)';

                sucNode.style.display = 'block';
                setTimeout(() => {
                    sucNode.style.display = 'none';
                }, 4000);
            } catch (err) {
                errNode.textContent = err.message || 'Failed to update password. Please try again.';
                errNode.style.display = 'block';
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalBtnText;
                }
            }
        });
    }
});

