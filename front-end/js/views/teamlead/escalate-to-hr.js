// /js/views/teamlead/escalate-to-hr.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guarded

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

    // Submission placeholder
    const submitBtn = document.getElementById('submit-escalation-btn');
    if(submitBtn) {
        submitBtn.addEventListener('click', () => {
            alert('Escalation created successfully!');
            window.location.href = 'escalations.html';
        });
    }
});
