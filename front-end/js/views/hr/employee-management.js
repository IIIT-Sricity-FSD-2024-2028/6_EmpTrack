// /js/views/hr/employee-management.js
import { auth } from '../../auth.js';
import { db } from '../../store.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = auth.getCurrentUser();
    if (!user) return; // Guard
    
    // Helper to map department ID to readable names
    const deptMap = { 'D01': 'HR', 'D02': 'Engineering', 'D03': 'Sales', 'D04': 'Design', 'D05': 'Marketing' };

    const getEmployeesFromDB = () => {
        return db.data.employee.map(e => ({
            id: e.emp_id,
            name: e.emp_name.split(' (')[0],
            email: e.email,
            dept: deptMap[e.department_id] || e.department_id || 'Engineering',
            role: e.role === 'TEAMLEAD' ? 'Team Lead' : e.role === 'HR' ? 'HR Admin' : 'Employee',
            joinDate: e.date_of_joining,
            status: e.status === 'ACTIVE' ? 'Active' : e.status === 'ON_LEAVE' ? 'On Leave' : 'Inactive'
        })).reverse();
    };

    let employees = getEmployeesFromDB();

    // Stats
    const countStats = () => {
        const total = employees.length;
        const active = employees.filter(e => e.status === 'Active').length;
        const onLeave = employees.filter(e => e.status === 'On Leave').length;
        const newThisMonth = 0; // simplistic map
        return { total, active, onLeave, newThisMonth };
    };

    const stats = countStats();

    // Output stats to DOM
    // Output stats to DOM
    document.getElementById('total-val').setAttribute('data-val', stats.total);
    document.getElementById('active-val').setAttribute('data-val', stats.active);
    document.getElementById('leave-val').setAttribute('data-val', stats.onLeave);
    document.getElementById('new-val').setAttribute('data-val', stats.newThisMonth);

    const tableBody = document.getElementById('empTableBody');
    const searchInput = document.getElementById('empSearch');
    const deptFilter = document.getElementById('empDeptFilter');
    const statusFilter = document.getElementById('empStatusFilter');
    const clearBtn = document.getElementById('empClearSort');

    // Make ID clicks global
    window.handleEmpClick = (id) => {
        alert('Clicked Employee ID: ' + id + '\n\n(In a full app, this would open the employee profile model or route.)');
    };

    function renderRows(data) {
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

    function applyFilters() {
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
        clearBtn.addEventListener('click', () => {
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
        addEmpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if(!addEmpForm.checkValidity()) {
                addEmpForm.reportValidity();
                return;
            }

            const name = document.getElementById('addEmpName').value.trim();
            const email = document.getElementById('addEmpEmail').value.trim();
            const dept = document.getElementById('addEmpDept').value;
            const role = document.getElementById('addEmpRole').value;
            
            let displayRole = role === 'TL' ? 'Team Lead' : role === 'HR' ? 'HR Admin' : 'Employee';
            if (dept === 'Engineering' && displayRole === 'Employee') displayRole = 'Developer';

            const newId = 'EMP-' + Math.floor(100 + Math.random() * 900);
            const today = new Date().toISOString().split('T')[0];
            
            let internalRole = 'EMPLOYEE';
            if (role === 'TL') internalRole = 'TEAMLEAD';
            else if (role === 'HR') internalRole = 'HR';

            db.data.employee.push({
                emp_id: newId,
                emp_name: name,
                email: email,
                phone: '0000000000',
                password: 'Password@123',
                role: internalRole,
                status: 'ACTIVE',
                date_of_joining: today,
                department_id: dept === 'Engineering' ? 'D02' : 'D01',
                manager_id: 'TL001' // Defaulting to the test TL
            });
            db.saveData();

            employees = getEmployeesFromDB();

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
