// /js/views/employee/raise-issue.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

export function renderRaiseIssue(container) {
    document.getElementById('page-title').innerHTML = `
        <div style="display:flex; align-items:center; gap: 15px;">
            <a href="#issues" style="color:var(--text-main); text-decoration:none;"><i class="ph ph-arrow-left"></i></a>
            <div>
                <div style="font-weight:var(--font-bold);">View Issue Status</div>
                <div style="font-size:12px; font-weight:normal; color:var(--text-muted);">Employee Portal</div>
            </div>
        </div>
    `;
    
    const user = auth.getCurrentUser();
    const activeTasks = db.getTasksForUser(user.emp_id).filter(t => t.status !== 'COMPLETED');

    container.innerHTML = `
        <div style="max-width: 900px; margin: 0 auto;">
            
            <!-- Info Banner -->
            <div style="background-color: var(--primary-light); border-radius: 12px; padding: 24px; margin-bottom: 24px; display:flex; gap: 16px;">
                <div style="color: var(--primary-color); font-size: 24px;"><i class="ph ph-info"></i></div>
                <div>
                    <h4 style="margin: 0 0 10px 0; color: var(--primary-hover); font-size: var(--text-md);">When to Raise an Issue?</h4>
                    <ul style="margin: 0; padding-left: 20px; color: var(--text-main); font-size: var(--text-sm); line-height: 1.6;">
                        <li>Productivity blockers</li>
                        <li>Technical issues</li>
                        <li>Resource problems</li>
                        <li>Team conflicts</li>
                        <li>Workload concerns</li>
                    </ul>
                </div>
            </div>

            <!-- Form Card -->
            <div class="card" style="padding: 32px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 24px 0; font-size: var(--text-lg); border-bottom: 1px solid var(--border-light); padding-bottom: 16px;">Issue Details</h3>
                
                <form id="raise-issue-form">
                    
                    <!-- Issue Type -->
                    <div style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Issue Type</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;" id="issue-type-grid">
                            <div class="radio-card selected" data-val="Low Productivity / Blocker">
                                <i class="ph ph-prohibit" style="font-size:20px; color:var(--text-muted);"></i> Low Productivity / Blocker
                            </div>
                            <div class="radio-card" data-val="Technical Issue / Bug">
                                <i class="ph ph-bug" style="font-size:20px; color:var(--text-muted);"></i> Technical Issue / Bug
                            </div>
                            <div class="radio-card" data-val="Resource Unavailable">
                                <i class="ph ph-hard-drives" style="font-size:20px; color:var(--text-muted);"></i> Resource Unavailable
                            </div>
                            <div class="radio-card" data-val="Missing Requirements">
                                <i class="ph ph-file-dashed" style="font-size:20px; color:var(--text-muted);"></i> Missing Requirements
                            </div>
                            <div class="radio-card" data-val="Team Conflict / Communication">
                                <i class="ph ph-users" style="font-size:20px; color:var(--text-muted);"></i> Team Conflict / Communication
                            </div>
                            <div class="radio-card" data-val="Workload / Capacity Issue">
                                <i class="ph ph-stack" style="font-size:20px; color:var(--text-muted);"></i> Workload / Capacity Issue
                            </div>
                            <div class="radio-card" data-val="Other Issue">
                                <i class="ph ph-dots-three-circle" style="font-size:20px; color:var(--text-muted);"></i> Other Issue
                            </div>
                        </div>
                        <input type="hidden" id="selected_type" value="Low Productivity / Blocker">
                    </div>

                    <!-- Priority Level -->
                    <div style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Priority Level</label>
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;" id="priority-grid">
                            <div class="radio-card selected" data-val="Low" style="flex-direction:column; align-items:flex-start;">
                                <div style="font-weight:bold;">Low</div>
                                <div style="font-size:11px; color:var(--text-muted);">"Can wait"</div>
                            </div>
                            <div class="radio-card" data-val="Medium" style="flex-direction:column; align-items:flex-start;">
                                <div style="font-weight:bold;">Medium</div>
                                <div style="font-size:11px; color:var(--text-muted);">"Needs attention"</div>
                            </div>
                            <div class="radio-card" data-val="High" style="flex-direction:column; align-items:flex-start;">
                                <div style="font-weight:bold; color:var(--danger-color);">High</div>
                                <div style="font-size:11px; color:var(--text-muted);">"Urgent"</div>
                            </div>
                        </div>
                        <input type="hidden" id="selected_priority" value="Low">
                    </div>

                    <!-- Related Task -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Related Task</label>
                        <select id="related_task" class="form-control" style="border-radius: var(--radius-md); padding: 12px 16px;">
                            <option value="">Select a task (if applicable)</option>
                            ${activeTasks.map(t => `<option value="${t.task_id}">#${t.task_id} - ${t.task_title}</option>`).join('')}
                        </select>
                    </div>

                    <!-- Title -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Issue Title</label>
                        <input type="text" id="title" class="form-control" required placeholder="Brief summary of the issue" style="border-radius: var(--radius-md); padding: 12px 16px;">
                    </div>

                    <!-- Description -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Detailed Description</label>
                        <textarea id="description" class="form-control" required rows="5" placeholder="Provide detailed information about the issue, what you've tried, and why you need escalation..." style="border-radius: var(--radius-md); padding: 16px; resize:vertical;"></textarea>
                        <span style="font-size: 11px; color: var(--text-muted); margin-top: 4px; display:inline-block;">Include error messages, steps to reproduce...</span>
                    </div>

                    <!-- Attachments -->
                    <div class="form-group" style="margin-bottom: 32px;">
                        <label class="form-label" style="font-weight: var(--font-medium);">Attachments Section</label>
                        <div style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align:center; background-color: var(--bg-main);">
                            <i class="ph ph-upload-simple" style="font-size: 32px; color: var(--text-muted); margin-bottom: 15px;"></i>
                            <div style="margin-bottom: 15px; color: var(--text-main);">Drag and drop files here, or click to browse</div>
                            <button type="button" class="btn btn-outline" style="padding: 8px 16px; border-radius: var(--radius-full);">Choose Files</button>
                            <div style="margin-top: 10px; font-size: 11px; color: var(--text-muted);">Max 10MB per file</div>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <button type="submit" class="btn btn-purple" style="padding: 14px 32px; display:flex; gap:10px; align-items:center; font-size:var(--text-md);">
                            Raise Issue to Team Lead <i class="ph ph-paper-plane-right"></i>
                        </button>
                        <button type="button" onclick="window.location.hash='#issues'" class="btn" style="border: 1px solid var(--primary-color); color: var(--primary-color); padding: 12px 32px; border-radius: var(--radius-full); background: transparent;">
                            Save as Draft
                        </button>
                    </div>

                </form>
            </div>

            <!-- Drafts Section -->
            <div style="margin-bottom: 40px;">
                <h3 style="margin: 0 0 16px 0; font-size: var(--text-lg);">Drafts</h3>
                <div style="background-color: var(--bg-surface); border: 1px dashed var(--border-color); border-radius: var(--radius-md); padding: 40px; text-align:center; color: var(--text-muted);">
                    No Drafts
                </div>
            </div>

        </div>
    `;

    // Interactive Card Binding Logic
    const bindRadioGrid = (gridId, inputId) => {
        const grid = document.getElementById(gridId);
        const input = document.getElementById(inputId);
        const cards = grid.querySelectorAll('.radio-card');
        
        cards.forEach(card => {
            card.addEventListener('click', () => {
                cards.forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                input.value = card.getAttribute('data-val');
            });
        });
    };

    bindRadioGrid('issue-type-grid', 'selected_type');
    bindRadioGrid('priority-grid', 'selected_priority');

    document.getElementById('raise-issue-form').addEventListener('submit', (e) => {
        e.preventDefault();
        db.createIssue({
            emp_id: user.emp_id,
            type: document.getElementById('selected_type').value,
            priority: document.getElementById('selected_priority').value,
            related_task: document.getElementById('related_task').value,
            title: document.getElementById('title').value,
            description: document.getElementById('description').value
        });
        window.location.hash = '#issues';
    });
}
