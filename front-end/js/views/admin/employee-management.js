// /js/views/admin/employee-management.js
import { auth } from '../../auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard

    // Dummy Data
    const employees = [
        { id: 'EMP-001', name: 'John Smith', email: 'john.smith@company.com', dept: 'Engineering', role: 'Senior Developer', joinDate: '2024-01-15', status: 'Active' },
        { id: 'EMP-002', name: 'Sarah Johnson', email: 'sarah.j@company.com', dept: 'Engineering', role: 'Full Stack Developer', joinDate: '2024-02-10', status: 'Active' },
        { id: 'EMP-003', name: 'Mike Davis', email: 'mike.d@company.com', dept: 'Engineering', role: 'Backend Developer', joinDate: '2024-03-01', status: 'Inactive' },
        { id: 'EMP-004', name: 'Emma Wilson', email: 'emma.w@company.com', dept: 'Engineering', role: 'QA Engineer', joinDate: '2024-03-20', status: 'On Leave' },
        { id: 'EMP-005', name: 'James Brown', email: 'james.b@company.com', dept: 'Engineering', role: 'Junior Developer', joinDate: '2024-04-05', status: 'Active' },
        { id: 'EMP-006', name: 'Alice Cooper', email: 'alice.c@company.com', dept: 'Design', role: 'UI/UX Designer', joinDate: '2023-10-12', status: 'Active' },
        { id: 'EMP-007', name: 'Bob Wilson', email: 'bob.w@company.com', dept: 'Marketing', role: 'Marketing Lead', joinDate: '2023-11-20', status: 'Active' },
        { id: 'EMP-008', name: 'Carol Smith', email: 'carol.s@company.com', dept: 'Sales', role: 'Sales Executive', joinDate: '2024-01-05', status: 'On Leave' }
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
            tr.innerHTML = `
                <td><a href="javascript:void(0)" class="emp-id-link" onclick="handleEmpClick('${emp.id}')">${emp.id}</a></td>
                <td>
                    <div class="emp-name-col">
                        <span class="emp-name">${emp.name}</span>
                        <span class="emp-email">${emp.email}</span>
                    </div>
                </td>
                <td>${emp.dept}</td>
                <td>${emp.role}</td>
                <td>${emp.joinDate}</td>
                <td><span class="badge ${badgeCls}" data-tooltip="${tooltip}">${emp.status}</span></td>
            `;
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
            
            let displayRole = role === 'TL' ? 'Team Lead' : role === 'HR' ? 'HR Manager' : role === 'ADMIN' ? 'Super Admin' : 'Employee';
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

