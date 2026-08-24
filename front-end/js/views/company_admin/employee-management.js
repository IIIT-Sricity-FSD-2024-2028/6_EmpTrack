// /js/views/company_admin/employee-management.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard

    // Dummy Data
    const employees = [
        { id: 'EMP-001', name: 'John Smith', email: 'john.smith@company.com', phone: '(555) 123-4567', address: '123 New York Ave, NY', dept: 'Engineering', role: 'Senior Developer', joinDate: '2024-01-15', status: 'Active' },
        { id: 'EMP-002', name: 'Sarah Johnson', email: 'sarah.j@company.com', phone: '(555) 234-5678', address: '456 California St, CA', dept: 'Engineering', role: 'Full Stack Developer', joinDate: '2024-02-10', status: 'Active' },
        { id: 'EMP-003', name: 'Mike Davis', email: 'mike.d@company.com', phone: '(555) 345-6789', address: '789 Seattle Blvd, WA', dept: 'Engineering', role: 'Backend Developer', joinDate: '2024-03-01', status: 'Inactive' },
        { id: 'EMP-004', name: 'Emma Wilson', email: 'emma.w@company.com', phone: '(555) 456-7890', address: '321 Chicago Blvd, IL', dept: 'Engineering', role: 'QA Engineer', joinDate: '2024-03-20', status: 'On Leave' },
        { id: 'EMP-005', name: 'James Brown', email: 'james.b@company.com', phone: '(555) 567-8901', address: '654 Austin St, TX', dept: 'Engineering', role: 'Junior Developer', joinDate: '2024-04-05', status: 'Active' },
        { id: 'EMP-006', name: 'Alice Cooper', email: 'alice.c@company.com', phone: '(555) 678-9012', address: '987 Miami Ave, FL', dept: 'Design', role: 'UI/UX Designer', joinDate: '2023-10-12', status: 'Active' },
        { id: 'EMP-007', name: 'Bob Wilson', email: 'bob.w@company.com', phone: '(555) 789-0123', address: '147 Denver Rd, CO', dept: 'Marketing', role: 'Marketing Lead', joinDate: '2023-11-20', status: 'Active' },
        { id: 'EMP-008', name: 'Carol Smith', email: 'carol.s@company.com', phone: '(555) 890-1234', address: '258 Boston Ct, MA', dept: 'Sales', role: 'Sales Executive', joinDate: '2024-01-05', status: 'On Leave' }
    ];

    // Stats
    const total = 156;
    const active = 148;
    const onLeave = 6;
    const newThisMonth = 5;

    // Output stats to DOM
    document.getElementById('total-val').setAttribute('data-val', total);
    document.getElementById('active-val').setAttribute('data-val', active);
    document.getElementById('leave-val').setAttribute('data-val', onLeave);
    document.getElementById('new-val').setAttribute('data-val', newThisMonth);

    const tableBody = document.getElementById('empTableBody');
    const searchInput = document.getElementById('empSearch');
    const deptFilter = document.getElementById('empDeptFilter');
    const statusFilter = document.getElementById('empStatusFilter');
    const clearBtn = document.getElementById('empClearSort');

    // Make ID clicks global
    window.handleEmpClick = async (id) => {
        alert('Clicked Employee ID: ' + id + '\n\n(In a full app, this would open the employee profile model or route.)');
    };

    window.currentEditId = null;

    window.handleEmpEdit = async (id) => {
        window.currentEditId = id;
        applyFilters();
    };
    
    window.handleEmpEditCancel = () => {
        window.currentEditId = null;
        applyFilters();
    };

    window.handleEmpEditSave = (id) => {
        const index = employees.findIndex(e => e.id === id);
        if(index !== -1) {
            const oldStatus = employees[index].status;
            const newStatus = document.getElementById('inlineStatus').value;
            
            employees[index].name = document.getElementById('inlineName').value.trim();
            employees[index].email = document.getElementById('inlineEmail').value.trim();
            employees[index].phone = document.getElementById('inlinePhone').value.trim();
            employees[index].address = document.getElementById('inlineAddress').value.trim();
            employees[index].dept = document.getElementById('inlineDept').value;
            employees[index].role = document.getElementById('inlineRole').value;
            employees[index].joinDate = document.getElementById('inlineJoinDate').value;
            employees[index].status = newStatus;
            
            if (oldStatus !== newStatus) {
                const counterMap = { 'Active': 'active-val', 'On Leave': 'leave-val' };
                if (counterMap[oldStatus]) {
                    const sVal = document.getElementById(counterMap[oldStatus]);
                    if(sVal) {
                        let cCount = parseInt(sVal.getAttribute('data-val'));
                        sVal.setAttribute('data-val', cCount - 1);
                        sVal.innerText = cCount - 1;
                    }
                }
                if (counterMap[newStatus]) {
                    const sVal = document.getElementById(counterMap[newStatus]);
                    if(sVal) {
                        let cCount = parseInt(sVal.getAttribute('data-val'));
                        sVal.setAttribute('data-val', cCount + 1);
                        sVal.innerText = cCount + 1;
                    }
                }
            }
        }
        window.currentEditId = null;
        applyFilters();
    };
    
    window.handleEmpDelete = async (id) => {
        if(confirm('Are you sure you want to delete employee ' + id + '?')) {
            const index = employees.findIndex(e => e.id === id);
            if(index !== -1) {
                const status = employees[index].status;
                employees.splice(index, 1);
                applyFilters();
                
                // Update total count locally
                const totalVal = document.getElementById('total-val');
                if(totalVal) {
                    let currentTotal = parseInt(totalVal.getAttribute('data-val'));
                    if(currentTotal > 0) {
                        totalVal.setAttribute('data-val', currentTotal - 1);
                        totalVal.innerText = currentTotal - 1;
                    }
                }
                
                // Update active/leave count if applicable
                const counterMap = { 'Active': 'active-val', 'On Leave': 'leave-val' };
                if (counterMap[status]) {
                    const statusVal = document.getElementById(counterMap[status]);
                    if(statusVal) {
                        let currentCount = parseInt(statusVal.getAttribute('data-val'));
                        if(currentCount > 0) {
                            statusVal.setAttribute('data-val', currentCount - 1);
                            statusVal.innerText = currentCount - 1;
                        }
                    }
                }
            }
        }
    };

    async function renderRows(data) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        if (data.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px; color:var(--text-muted);">No employees found matching your criteria.</td></tr>`;
            return;
        }

        data.forEach(emp => {
            let badgeCls = emp.status === 'Active' ? 'active' : emp.status === 'Inactive' ? 'inactive' : 'leave';
            let tooltip = emp.status === 'Active' ? 'Currently working' : emp.status === 'Inactive' ? 'No longer active' : 'Currently on approved leave';

            const tr = document.createElement('tr');
            if (emp.id === window.currentEditId) {
                tr.innerHTML = `
                    <td>${emp.id}</td>
                    <td style="min-width: 200px;">
                        <input type="text" id="inlineName" value="${emp.name}" placeholder="Name" style="width:100%; margin-bottom:4px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                        <input type="email" id="inlineEmail" value="${emp.email}" placeholder="Email" style="width:100%; margin-bottom:4px; font-size:12px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                        <input type="text" id="inlinePhone" value="${emp.phone || ''}" placeholder="Phone" style="width:100%; margin-bottom:4px; font-size:12px; padding:4px; border:1px solid #ccc; border-radius:4px;" />
                        <textarea id="inlineAddress" placeholder="Address" style="width:100%; font-size:12px; padding:4px; border:1px solid #ccc; border-radius:4px; resize:vertical; min-height:40px;">${emp.address || ''}</textarea>
                    </td>
                    <td style="min-width: 160px;">
                        <select id="inlineDept" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;">
                            <option value="Engineering" ${emp.dept==='Engineering'?'selected':''}>Engineering</option>
                            <option value="Design" ${emp.dept==='Design'?'selected':''}>Design</option>
                            <option value="Marketing" ${emp.dept==='Marketing'?'selected':''}>Marketing</option>
                            <option value="Sales" ${emp.dept==='Sales'?'selected':''}>Sales</option>
                            <option value="HR" ${emp.dept==='HR'?'selected':''}>HR</option>
                        </select>
                    </td>
                    <td style="min-width: 180px;"><input type="text" id="inlineRole" value="${emp.role}" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;" /></td>
                    <td><input type="date" id="inlineJoinDate" value="${emp.joinDate}" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;" /></td>
                    <td>
                        <select id="inlineStatus" style="width:100%; padding:4px; border:1px solid #ccc; border-radius:4px;">
                            <option value="Active" ${emp.status==='Active'?'selected':''}>Active</option>
                            <option value="Inactive" ${emp.status==='Inactive'?'selected':''}>Inactive</option>
                            <option value="On Leave" ${emp.status==='On Leave'?'selected':''}>On Leave</option>
                        </select>
                    </td>
                    <td style="text-align: center;">
                        <button class="btn-icon" onclick="handleEmpEditSave('${emp.id}')" title="Save" style="background:none; border:none; color:var(--emp-success); cursor:pointer; font-size:18px; margin-right:8px;">
                            <i class="ph-bold ph-check"></i>
                        </button>
                        <button class="btn-icon" onclick="handleEmpEditCancel()" title="Cancel" style="background:none; border:none; color:var(--emp-danger); cursor:pointer; font-size:18px;">
                            <i class="ph-bold ph-x"></i>
                        </button>
                    </td>
                `;
            } else {
                tr.innerHTML = `
                    <td><a href="javascript:void(0)" class="emp-id-link" onclick="handleEmpClick('${emp.id}')">${emp.id}</a></td>
                    <td>
                        <div class="emp-name-col">
                            <span class="emp-name">${emp.name}</span>
                            <span class="emp-email" style="margin-bottom:2px;">${emp.email}</span>
                            <span style="font-size:12px; color:var(--text-muted);"><i class="ph ph-phone" style="vertical-align:middle; margin-right:2px;"></i> ${emp.phone || 'N/A'}</span>
                            <span style="font-size:11px; color:var(--text-muted);"><i class="ph ph-map-pin" style="vertical-align:middle; margin-right:2px;"></i> ${emp.address || 'N/A'}</span>
                        </div>
                    </td>
                    <td>${emp.dept}</td>
                    <td>${emp.role}</td>
                    <td>${emp.joinDate}</td>
                    <td><span class="badge ${badgeCls}" data-tooltip="${tooltip}">${emp.status}</span></td>
                    <td style="text-align: center;">
                        <button class="btn-icon edit-btn" onclick="handleEmpEdit('${emp.id}')" title="Edit Employee" style="background:none; border:none; color:var(--emp-primary); cursor:pointer; font-size:18px; margin-right:8px;">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                        <button class="btn-icon delete-btn" onclick="handleEmpDelete('${emp.id}')" title="Delete Employee" style="background:none; border:none; color:var(--emp-danger); cursor:pointer; font-size:18px;">
                            <i class="ph ph-trash"></i>
                        </button>
                    </td>
                `;
            }
            tableBody.appendChild(tr);
        });
    }

    async function applyFilters() {
        const query = searchInput.value.toLowerCase();
        const dept = deptFilter.value;
        const status = statusFilter.value;

        const filtered = employees.filter(e => {
            const mText = e.name.toLowerCase().includes(query) || e.email.toLowerCase().includes(query) || e.id.toLowerCase().includes(query);
            const mDept = dept === 'all' || e.dept === dept;
            const mStatus = status === 'all' || e.status === status;
            return mText && mDept && mStatus;
        });

        renderRows(filtered);
    }

    // Bind events
    if(searchInput) searchInput.addEventListener('input', applyFilters);
    if(deptFilter) deptFilter.addEventListener('change', applyFilters);
    if(statusFilter) statusFilter.addEventListener('change', applyFilters);
    
    if(clearBtn) {
        clearBtn.addEventListener('click', async () => {
            searchInput.value = '';
            deptFilter.value = 'all';
            statusFilter.value = 'all';
            applyFilters();
        });
    }

    // Add Employee Logic
    const addEmpForm = document.getElementById('addEmpForm');
    const addEmpSuccess = document.getElementById('addEmpSuccess');
    if(addEmpForm) {
        addEmpForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if(!addEmpForm.checkValidity()) {
                addEmpForm.reportValidity();
                return;
            }

            const name = document.getElementById('addEmpName').value.trim();
            const email = document.getElementById('addEmpEmail').value.trim();
            const dept = document.getElementById('addEmpDept').value;
            const role = document.getElementById('addEmpRole').value;
            
            let displayRole = role === 'TL' ? 'Team Lead' : role === 'HR' ? 'HR Manager' : role === 'COMPANY_ADMIN' ? 'Company Admin' : 'Employee';
            if (dept === 'Engineering' && displayRole === 'Employee') displayRole = 'Developer';

            const newId = 'EMP-' + String(employees.length + 1).padStart(3, '0');
            const today = new Date().toISOString().split('T')[0];

            employees.unshift({
                id: newId,
                name: name,
                email: email,
                dept: dept,
                role: displayRole,
                joinDate: today,
                status: 'Active'
            });

            applyFilters();
            
            const totalVal = document.getElementById('total-val');
            if(totalVal) {
                totalVal.setAttribute('data-val', parseInt(totalVal.getAttribute('data-val')) + 1);
                totalVal.innerText = totalVal.getAttribute('data-val');
            }

            const activeVal = document.getElementById('active-val');
            if(activeVal) {
                activeVal.setAttribute('data-val', parseInt(activeVal.getAttribute('data-val')) + 1);
                activeVal.innerText = activeVal.getAttribute('data-val');
            }

            addEmpSuccess.style.display = 'block';
            addEmpForm.reset();

            setTimeout(() => {
                addEmpSuccess.style.display = 'none';
            }, 3000);
        });
    }



    // Animate summary stats
    const counters = document.querySelectorAll('.count-anim');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-val');
        const duration = 1000;
        const step = Math.max(1, Math.ceil(target / (duration / 16)));
        let current = 0;

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                counter.innerText = target;
                clearInterval(timer);
            } else {
                counter.innerText = current;
            }
        }, 16);
    });

    // Simulate load time for bonus feature
    setTimeout(() => {
        renderRows(employees);
    }, 600);
});

