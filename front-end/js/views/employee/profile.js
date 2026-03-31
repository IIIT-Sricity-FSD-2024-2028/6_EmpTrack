// /js/views/employee/profile.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const session = auth.getCurrentUser();
    if (!session) return; // Guarded
    const user = db.getUserById(session.emp_id);

    // Skills payload
    const skills = ['React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'GraphQL'];

    // HR Data
    const manager = db.getUserById(user.manager_id);
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
        pwForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const currentField = document.getElementById('current_pw');
            const newField = document.getElementById('new_pw');
            const countField = document.getElementById('confirm_pw');
            
            const errNode = document.getElementById('pw_error');
            const sucNode = document.getElementById('pw_success');

            errNode.style.display = 'none';
            sucNode.style.display = 'none';

            // Basic Math constraint validation
            if (newField.value !== countField.value) {
                errNode.style.display = 'block';
                countField.style.borderColor = 'var(--danger-color)';
                return;
            }

            // Simulating Backend Accept state
            currentField.value = '';
            newField.value = '';
            countField.value = '';
            countField.style.borderColor = 'var(--border-color)';
            
            sucNode.style.display = 'block';
            setTimeout(() => {
                sucNode.style.display = 'none';
            }, 4000); 
        });
    }
});
