// /js/views/teamlead/escalate-to-hr.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded
<<<<<<< HEAD

    // Force Navbar Highlight
    setTimeout(() => {
        const navLinks = document.querySelectorAll('.nav-link'); // Assuming modern class
        navLinks.forEach(l => l.classList.remove('active'));
        const escLink = Array.from(navLinks).find(l => l.href && l.href.includes('escalations.html'));
        if (escLink) escLink.classList.add('active');
    }, 100);

    const recentEscalations = [
        { id: 'ESC-402', title: 'Recurring harassment complaint', priority: 'High', status: 'Under Review', date: '2026-03-25', priorityColor: 'var(--danger-color)' },
        { id: 'ESC-391', title: 'Request for server upgrades', priority: 'Medium', status: 'Approved', date: '2026-03-15', priorityColor: 'var(--warning-color)' },
        { id: 'ESC-385', title: 'Prolonged absence without leave', priority: 'High', status: 'Resolved', date: '2026-03-01', priorityColor: 'var(--danger-color)' }
    ];

    const tbody = document.getElementById('recent-escalations-body');
    if (tbody) {
        tbody.innerHTML = recentEscalations.map(esc => `
            <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-md); display:flex; flex-direction:column; gap: var(--spacing-sm); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor:pointer;" class="recent-card">
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <span style="font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-bold);">${esc.id}</span>
                    <span style="padding: 2px 8px; border-radius: var(--radius-full); font-size: 10px; background-color: var(--bg-main); color: var(--text-main); font-weight: var(--font-medium);">${esc.date}</span>
                </div>
                <h4 style="margin:0; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${esc.title}">${esc.title}</h4>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top: auto;">
                    <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 10px; background-color: ${esc.priorityColor}20; color: ${esc.priorityColor}; font-weight: var(--font-bold);">${esc.priority}</span>
                    <span style="font-size: 12px; color: ${esc.status === 'Resolved' || esc.status === 'Approved' ? 'var(--secondary-color)' : 'var(--warning-color)'}; font-weight: var(--font-medium);">${esc.status}</span>
                </div>
            </div>
        `).join('');
=======
    
    // Draft loader if escalated from previous page
    const draftId = localStorage.getItem('escalate_draft_id');
    if (draftId) {
        localStorage.removeItem('escalate_draft_id');
        // If we wanted to pre-fill from draft we could match it here.
>>>>>>> f6cb44aae91333eb5fe31f0a0678255269e72ec3
    }

    const renderRecent = () => {
        const escalations = db.getAllEscalations().filter(e => e.escalated_from === user.emp_id);
        const recentEscalations = escalations.map(e => {
            let priorityColor = 'var(--secondary-color)';
            if (e.priority === 'High') priorityColor = 'var(--danger-color)';
            else if (e.priority === 'Medium') priorityColor = 'var(--warning-color)';
            
            return {
                id: e.escalation_id,
                title: e.title || e.escalation_reason || 'Escalation',
                priority: e.priority || 'Medium',
                status: e.status === 'OPEN' ? 'Under Review' : e.status,
                date: e.escalation_date,
                priorityColor
            };
        }).reverse().slice(0, 5); // top 5

        const tbody = document.getElementById('recent-escalations-body');
        if (tbody) {
            tbody.innerHTML = recentEscalations.map(esc => `
                <div style="background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: var(--spacing-md); display:flex; flex-direction:column; gap: var(--spacing-sm); transition: transform 0.2s ease, box-shadow 0.2s ease; cursor:pointer;" class="recent-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span style="font-size: var(--text-xs); color: var(--text-muted); font-weight: var(--font-bold);">${esc.id}</span>
                        <span style="padding: 2px 8px; border-radius: var(--radius-full); font-size: 10px; background-color: var(--bg-main); color: var(--text-main); font-weight: var(--font-medium);">${esc.date}</span>
                    </div>
                    <h4 style="margin:0; font-size: var(--text-sm); font-weight: var(--font-semibold); color: var(--text-main); margin-bottom:8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${esc.title}">${esc.title}</h4>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top: auto;">
                        <span style="padding: 4px 8px; border-radius: var(--radius-full); font-size: 10px; background-color: ${esc.priorityColor}20; color: ${esc.priorityColor}; font-weight: var(--font-bold);">${esc.priority}</span>
                        <span style="font-size: 12px; color: ${esc.status === 'Resolved' || esc.status === 'Approved' ? 'var(--secondary-color)' : 'var(--warning-color)'}; font-weight: var(--font-medium);">${esc.status}</span>
                    </div>
                </div>
            `).join('');
            
            if(recentEscalations.length === 0) {
                tbody.innerHTML = '<div style="padding: 20px; text-align:center; color: var(--text-muted); font-size: var(--text-sm);">No active escalations</div>';
            }
        }
    };
    
    renderRecent();

    // Back arrow navigation
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'escalations.html';
        });
    }

    // Toggle switch logic (Hides Related Employee if personal)
    const toggleInput = document.getElementById('personal-issue-toggle');
    const relatedEmpWrapper = document.getElementById('related-employee-wrapper');
    if (toggleInput && relatedEmpWrapper) {
        toggleInput.addEventListener('change', (e) => {
            if (e.target.checked) {
                relatedEmpWrapper.style.opacity = '0.5';
                relatedEmpWrapper.style.pointerEvents = 'none';
                relatedEmpWrapper.querySelector('input').value = '';
            } else {
                relatedEmpWrapper.style.opacity = '1';
                relatedEmpWrapper.style.pointerEvents = 'auto';
            }
        });
    }

    // Category Grid Selection logic
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) {
        const catBtns = categoryGrid.querySelectorAll('.cat-btn');
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                catBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });
    }

    // Priority Chips logic
    const priorityChips = document.getElementById('priority-chips');
    if (priorityChips) {
        const pChips = priorityChips.querySelectorAll('.priority-chip');
        pChips.forEach(chip => {
            chip.addEventListener('click', () => {
                // Reset all
                pChips.forEach(c => {
                    c.classList.remove('active');
                    c.style.backgroundColor = 'transparent';
                    c.style.borderColor = 'var(--border-color)';
                    c.style.color = 'var(--text-main)';
                });
                // Activate clicked
                chip.classList.add('active');
                const pColor = chip.getAttribute('data-color');
                chip.style.backgroundColor = pColor + '20'; // 20 hex opacity approx 12%
                chip.style.borderColor = pColor;
                chip.style.color = pColor;
            });
        });
    }

<<<<<<< HEAD
    // Submission and Validation Logic
=======
    // Submission logic
>>>>>>> f6cb44aae91333eb5fe31f0a0678255269e72ec3
    const submitBtn = document.getElementById('submit-escalation-btn');
    const errorMsg = document.getElementById('form-error-msg');
    
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
<<<<<<< HEAD
            // Reset error
            if(errorMsg) { 
                errorMsg.style.display = 'none'; 
                errorMsg.textContent = ''; 
            }

            const titleInput = document.getElementById('issue-title-input').value.trim();
            const descInput = document.getElementById('issue-desc-textarea').value.trim();
            const empName = document.getElementById('personal-issue-toggle').checked ? 'Personal' : document.getElementById('related-emp-input').value.trim();
            
            const activeCat = document.querySelector('.cat-btn.selected');
            const category = activeCat ? activeCat.getAttribute('data-value') : null;
            
            const activePriority = document.querySelector('.priority-chip.active');
            const priority = activePriority ? activePriority.textContent : null;

            if (!category || !priority || !titleInput || !descInput) {
                if(errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = 'Please fill out all required fields marked with *';
                } else {
                    alert('Please fill out all required fields.');
                }
                return;
            }

            if (!document.getElementById('personal-issue-toggle').checked && !empName) {
                if(errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = 'Please provide a related employee name.';
                }
                return;
            }

            // Save to DB
            db.createEscalationRecord({
                title: titleInput,
                description: descInput,
                category: category,
                priority: priority,
                related_employee: empName,
                escalated_by: user.emp_id
=======
            const titleInput = document.querySelector('input[placeholder="Short and descriptive title..."]');
            const descInput = document.querySelector('textarea');
            const relInput = document.querySelector('input[placeholder="Start typing the name..."]');
            
            const catSelected = document.querySelector('.cat-btn.selected');
            const prioSelected = document.querySelector('.priority-chip.active');
            
            if(!titleInput.value || !descInput.value || !catSelected || !prioSelected) {
                alert('Please fill out all required fields.');
                return;
            }

            db.createEscalation({
                escalated_from: user.emp_id,
                escalated_to: 'HR001', // Default HR id
                title: titleInput.value,
                escalation_reason: descInput.value,
                category: catSelected.getAttribute('data-value'),
                priority: prioSelected.textContent.trim(),
                related_employee: relInput.value || null
>>>>>>> f6cb44aae91333eb5fe31f0a0678255269e72ec3
            });

            alert('Escalation created successfully!');
            window.location.href = 'escalations.html';
        });
    }
});
