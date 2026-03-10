CREATE DATABASE EmpTrack;
USE EmpTrack;
CREATE TABLE Department (
    department_id INT PRIMARY KEY,
    dep_name VARCHAR(100)
);
CREATE TABLE Team (
    team_id INT PRIMARY KEY,
    team_name VARCHAR(100),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);
CREATE TABLE Employee (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(15),
    password VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(20),
    date_of_joining DATE,
    department_id INT,
    team_id INT,
    FOREIGN KEY (department_id) REFERENCES Department(department_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
); CREATE TABLE Attendance (
    attendance_id VARCHAR(20) PRIMARY KEY,
    emp_id INT,
    attendance_date DATE,
    attendance_mode VARCHAR(20),
    check_in_time TIME,
    check_out_time TIME,
    screen_time INT,
    status VARCHAR(20),
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id)
); CREATE TABLE Leave_Details (
    leave_id INT PRIMARY KEY,
    emp_id INT,
    start_date DATE,
    end_date DATE,
    leave_type VARCHAR(20),
    reason TEXT,
    status VARCHAR(20),
    applied_date DATE,
    approved_date DATE,
    approved_by INT,
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id),
    FOREIGN KEY (approved_by) REFERENCES Employee(emp_id)
); CREATE TABLE Leave_Balance (
    balance_id INT PRIMARY KEY,
    emp_id INT,
    total_leaves INT,
    used_leaves INT,
    remaining_leaves INT,
    last_updated DATE,
    FOREIGN KEY (emp_id) REFERENCES Employee(emp_id)
); CREATE TABLE Work_Allocation (
    allocation_id INT PRIMARY KEY,
    allocated_by INT,
    allocated_to INT,
    allocation_date DATE,
    description TEXT,
    deadline DATE,
    status VARCHAR(20),
    FOREIGN KEY (allocated_by) REFERENCES Employee(emp_id),
    FOREIGN KEY (allocated_to) REFERENCES Employee(emp_id)
); CREATE TABLE Task (
    task_id INT PRIMARY KEY,
    task_title VARCHAR(150),
    allocation_id INT,
    assigned_to INT,
    task_description TEXT,
    priority VARCHAR(20),
    deadline DATE,
    status VARCHAR(20),
    progress_percentage INT,
    updated_date DATE,
    FOREIGN KEY (allocation_id) REFERENCES Work_Allocation(allocation_id),
    FOREIGN KEY (assigned_to) REFERENCES Employee(emp_id)
);
CREATE TABLE Work_Log (
    worklog_id INT PRIMARY KEY,
    employee_id INT,
    task_id INT,
    log_date DATE,
    start_time TIME,
    end_time TIME,
    hours_spent DECIMAL(5,2),
    progress_percentage INT,
    status_update VARCHAR(20),
    FOREIGN KEY (employee_id) REFERENCES Employee(emp_id),
    FOREIGN KEY (task_id) REFERENCES Task(task_id)
); CREATE TABLE Escalation (
    escalation_id INT PRIMARY KEY,
    reference_type VARCHAR(20),
    reference_id INT,
    escalated_from INT,
    escalated_to INT,
    escalation_reason TEXT,
    escalation_date DATE,
    status VARCHAR(20),
    FOREIGN KEY (escalated_from) REFERENCES Employee(emp_id),
    FOREIGN KEY (escalated_to) REFERENCES Employee(emp_id)
); CREATE TABLE Attendance_Regularization (
    reg_id INT PRIMARY KEY,
    attendance_id VARCHAR(20),
    employee_id INT,
    reason TEXT,
    request_date DATE,
    approval_state VARCHAR(20),
    approved_by INT,
    approval_date DATE,
    FOREIGN KEY (attendance_id) REFERENCES Attendance(attendance_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(emp_id),
    FOREIGN KEY (approved_by) REFERENCES Employee(emp_id)
);
CREATE TABLE Report (
    report_id INT PRIMARY KEY,
    report_type VARCHAR(50),
    generated_by INT,
    generate_date DATE,
    from_date DATE,
    to_date DATE,
    format VARCHAR(20),
    status VARCHAR(20),
    FOREIGN KEY (generated_by) REFERENCES Employee(emp_id)
); CREATE TABLE Corrects (
    attendance_id VARCHAR(20),
    task_id INT,
    PRIMARY KEY (attendance_id, task_id),
    FOREIGN KEY (attendance_id) REFERENCES Attendance(attendance_id),
    FOREIGN KEY (task_id) REFERENCES Task(task_id)
);



