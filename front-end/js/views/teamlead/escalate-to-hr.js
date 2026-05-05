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
        { id: 'HR-ESC-001', priorityBadge: 'High Priority', priorityColor: '#EF4444', statusBadge: 'Under Review', statusBg: '#DBEAFE', statusColor: '#1D4ED8', title: 'Team conflict between two developers', desc: 'Team Conflict • Related to: John Smith, Sarah Johnson • Mar 8, 2026' },
        { id: 'HR-ESC-002', priorityBadge: 'Medium Priority', priorityColor: '#D97706', statusBadge: 'Pending', statusBg: '#F1F5F9', statusColor: '#475569', title: 'Request for additional team member', desc: 'Resource Request • Related to: N/A • Mar 4, 2026' },
        { id: 'HR-ESC-003', priorityBadge: 'High Priority', priorityColor: '#EF4444', statusBadge: 'Resolved', statusBg: '#D1FAE5', statusColor: '#047857', title: 'Repeated policy violation by team member', desc: 'Policy Violation • Related to: Mike Davis • Feb 28, 2026' }
    ];

    const tbody = document.getElementById('recent-escalations-body');
    if (tbody) {
        tbody.innerHTML = recentEscalations.map(esc => `
            <div style="border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 16px; background: white; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="display:flex; align-items:center; gap: 8px; margin-bottom: 6px;">
                        <span style="font-size: 13px; font-weight: 600; color: #6A11CB;">${esc.id}</span>
                        <span style="font-size: 10px; font-weight: 600; color: ${esc.priorityColor}; background-color: ${esc.priorityColor}15; padding: 2px 8px; border-radius: 12px;">${esc.priorityBadge}</span>
                        <span style="font-size: 10px; font-weight: 600; color: ${esc.statusColor}; background-color: ${esc.statusBg}; padding: 2px 8px; border-radius: 12px;">${esc.statusBadge}</span>
                    </div>
                    <div style="font-size: 14px; font-weight: 600; color: #1E293B; margin-bottom: 4px;">${esc.title}</div>
                    <div style="font-size: 11px; color: #64748B;">${esc.desc}</div>
                </div>
                <button style="background:none; border:none; color: #6A11CB; font-size: 12px; font-weight: 600; cursor:pointer;">View Details</button>
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

    // Toggle switch logic
    const toggleInput = document.getElementById('personal-issue-toggle');
    const relatedEmpWrapper = document.getElementById('related-employee-wrapper');
    if (toggleInput && relatedEmpWrapper) {
        toggleInput.addEventListener('change', (e) => {
            if (e.target.checked) {
                relatedEmpWrapper.style.opacity = '0.4';
                relatedEmpWrapper.style.pointerEvents = 'none';
                relatedEmpWrapper.querySelector('input').value = '';
            } else {
                relatedEmpWrapper.style.opacity = '1';
                relatedEmpWrapper.style.pointerEvents = 'auto';
            }
        });
    }

    // Category Selection
    let selectedCategory = null;
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) {
        const catBtns = categoryGrid.querySelectorAll('.cat-btn');
        catBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                catBtns.forEach(b => {
                    b.style.borderColor = '#E2E8F0';
                    b.style.backgroundColor = 'white';
                    b.style.color = '#475569';
                    b.classList.remove('selected');
                });
                btn.style.borderColor = '#6A11CB';
                btn.style.backgroundColor = '#F3E8FF';
                btn.style.color = '#6A11CB';
                btn.classList.add('selected');
                selectedCategory = btn.getAttribute('data-value');
            });
        });
    }

    // Priority Selection
    let selectedPriority = null;
    const priorityCards = document.getElementById('priority-cards');
    if (priorityCards) {
        const pCards = priorityCards.querySelectorAll('.priority-card');
        pCards.forEach(card => {
            card.addEventListener('click', () => {
                pCards.forEach(c => {
                    c.style.borderColor = '#E2E8F0';
                    c.style.backgroundColor = 'transparent';
                    c.classList.remove('active');
                });
                card.style.borderColor = '#6A11CB';
                card.style.backgroundColor = '#F3E8FF';
                card.classList.add('active');
                selectedPriority = card.getAttribute('data-value');
            });
        });
    }

    const saveEscalation = (isDraft) => {
        const title = document.getElementById('issue-title-input').value.trim();
        const desc = document.getElementById('issue-desc-textarea').value.trim();
        const isPersonal = document.getElementById('personal-issue-toggle').checked;
        const empName = document.getElementById('related-emp-input').value.trim();

        if (!isDraft) {
            if (!selectedCategory || !selectedPriority || !title || !desc) {
                alert('Please fill out all required fields marked with *');
                return false;
            }
        }

        const escalationData = {
            id: 'HR-ESC-' + Date.now(),
            issueTitle: title,
            taskTitle: title,
            description: desc,
            reason: desc,
            category: selectedCategory,
            priority: selectedPriority,
            relatedEmployee: empName || 'N/A',
            employeeName: empName || 'N/A',
            raisedBy: user.name || user.emp_id || 'Team Lead',
            date: new Date().toLocaleDateString(),
            status: isDraft ? 'Draft' : 'Pending',
            taskId: 'N/A',
            progress: 0,
            hours: 0
        };

        const storageKey = isDraft ? 'hrEscalationDrafts' : 'hrEscalations';
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        existing.push(escalationData);
        localStorage.setItem(storageKey, JSON.stringify(existing));

        // Also save to "escalations" key for Team Lead page
        if (!isDraft) {
            const tlEscalations = JSON.parse(localStorage.getItem('escalations') || '[]');
            tlEscalations.push({
                employeeName: empName || 'N/A',
                taskId: 'N/A',
                taskTitle: title,
                progress: '0%',
                hours: '0/0',
                reason: desc
            });
            localStorage.setItem('escalations', JSON.stringify(tlEscalations));
        }

        console.log("Saved HR escalation", escalationData);

        if (isDraft) {
            alert('Escalation saved as draft successfully!');
        } else {
            alert('Escalation submitted to HR successfully!');
            // Optional: reset form
            window.location.href = 'escalations.html';
        }
        return true;
    };

    const submitBtn = document.getElementById('submit-escalation-btn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => saveEscalation(false));
    }

    const saveDraftBtn = document.getElementById('save-draft-btn');
    if (saveDraftBtn) {
        saveDraftBtn.addEventListener('click', () => saveEscalation(true));
    }
});

