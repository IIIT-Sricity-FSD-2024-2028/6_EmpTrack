// /js/views/teamlead/escalate-to-hr.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

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
    }

    // Back arrow navigation
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
        backBtn.addEventListener('click', async () => {
            window.location.href = 'escalations.html';
        });
    }

    // Toggle switch logic (Hides Related Employee if personal)
    const toggleInput = document.getElementById('personal-issue-toggle');
    const relatedEmpWrapper = document.getElementById('related-employee-wrapper');
    if (toggleInput && relatedEmpWrapper) {
        toggleInput.addEventListener('change', async (e) => {
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
            btn.addEventListener('click', async () => {
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
            chip.addEventListener('click', async () => {
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

    // Submission and Validation Logic
    const submitBtn = document.getElementById('submit-escalation-btn');
    const errorMsg = document.getElementById('form-error-msg');
    
    if(submitBtn) {
        submitBtn.addEventListener('click', async () => {
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
            await db.createEscalationRecord({
                title: titleInput,
                description: descInput,
                category: category,
                priority: priority,
                related_employee: empName,
                escalated_by: user.emp_id
            });

            alert('Escalation created successfully!');
            window.location.href = 'escalations.html';
        });
    }
});
