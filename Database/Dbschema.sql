CREATE DATABASE EmpTrack;
USE EmpTrack;
CREATE TABLE Department (
    department_id INT PRIMARY KEY,
    dep_name VARCHAR(50) NOT NULL UNIQUE
);
CREATE TABLE Team (
    team_id INT PRIMARY KEY,
    team_name VARCHAR(50) NOT NULL UNIQUE,
    department_id INT NOT NULL,

    FOREIGN KEY (department_id)
    REFERENCES Department(department_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE TABLE Employee (
    emp_id INT PRIMARY KEY,
    emp_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(15) UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status ENUM('ACTIVE','INACTIVE') NOT NULL,
    date_of_joining DATE NOT NULL,
    department_id INT NOT NULL,
    team_id INT NOT NULL,

    FOREIGN KEY (department_id)
    REFERENCES Department(department_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

    FOREIGN KEY (team_id)
    REFERENCES Team(team_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE TABLE Attendance (
    attendance_id VARCHAR(20) PRIMARY KEY,
    emp_id INT NOT NULL,
    attendance_date DATE NOT NULL,
    attendance_mode VARCHAR(20),
    check_in_time TIME,
    check_out_time TIME,
    screen_time INT,
    status ENUM('PRESENT','ABSENT','HALF_DAY','REMOTE') NOT NULL,

    UNIQUE(emp_id, attendance_date),

    FOREIGN KEY (emp_id)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE TABLE Leave_Details (
    leave_id INT PRIMARY KEY,
    emp_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_type ENUM('CASUAL','SICK','PAID','UNPAID') NOT NULL,
    reason TEXT,
    status ENUM('PENDING','APPROVED','REJECTED','CANCELLED') NOT NULL,
    applied_date DATE NOT NULL,
    approved_date DATE,
    approved_by INT,

    FOREIGN KEY (emp_id)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (approved_by)
    REFERENCES Employee(emp_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE
);
CREATE TABLE Leave_Balance (
    balance_id INT PRIMARY KEY,
    emp_id INT NOT NULL UNIQUE,
    total_leaves INT NOT NULL,
    used_leaves INT NOT NULL,
    remaining_leaves INT NOT NULL,
    last_updated DATE NOT NULL,

    FOREIGN KEY (emp_id)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
CREATE TABLE Work_Allocation (
    allocation_id INT PRIMARY KEY,
    allocated_by INT NOT NULL,
    allocated_to INT NOT NULL,
    allocation_date DATE NOT NULL,
    description TEXT,
    deadline DATE,
    status ENUM('ASSIGNED','IN_PROGRESS','COMPLETED') NOT NULL,

    FOREIGN KEY (allocated_by)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (allocated_to)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Task (
    task_id INT PRIMARY KEY,
    task_title VARCHAR(200) NOT NULL,
    allocation_id INT NOT NULL,
    assigned_to INT NOT NULL,
    task_description TEXT,
    priority ENUM('LOW','MEDIUM','HIGH') NOT NULL,
    deadline DATE NOT NULL,
    status ENUM('NOT_STARTED','IN_PROGRESS','COMPLETED','BLOCKED') NOT NULL,
    progress_percentage INT,
    updated_date DATE,

    FOREIGN KEY (allocation_id)
    REFERENCES Work_Allocation(allocation_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (assigned_to)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Work_Log (
    worklog_id INT PRIMARY KEY,
    employee_id INT NOT NULL,
    task_id INT NOT NULL,
    log_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_spent INT NOT NULL,
    progress_percentage INT,
    status ENUM('STARTED','IN_PROGRESS','COMPLETED') NOT NULL,

    FOREIGN KEY (employee_id)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (task_id)
    REFERENCES Task(task_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Attendance_Regularization (
    reg_id INT PRIMARY KEY,
    attendance_id VARCHAR(20) NOT NULL,
    employee_id INT NOT NULL,
    reason TEXT NOT NULL,
    request_date DATE NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL,
    approved_by INT,
    approval_date DATE,

    FOREIGN KEY (attendance_id)
    REFERENCES Attendance(attendance_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (employee_id)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Escalation (
    escalation_id INT PRIMARY KEY,
    reference_type ENUM('TASK','LEAVE','ATTENDANCE') NOT NULL,
    reference_id INT NOT NULL,
    escalated_from INT NOT NULL,
    escalated_to INT NOT NULL,
    escalation_reason TEXT NOT NULL,
    escalation_date DATE NOT NULL,
    status ENUM('OPEN','IN_PROGRESS','RESOLVED','CLOSED') NOT NULL,

    FOREIGN KEY (escalated_from)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (escalated_to)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Report (
    report_id INT PRIMARY KEY,
    report_type ENUM('ATTENDANCE','LEAVE','WORK') NOT NULL,
    generated_by INT NOT NULL,
    generate_date DATE NOT NULL,
    from_date DATE,
    to_date DATE,
    format ENUM('PDF','CSV','EXCEL'),
    status ENUM('GENERATED','FAILED','PENDING') NOT NULL,

    FOREIGN KEY (generated_by)
    REFERENCES Employee(emp_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);CREATE TABLE Corrects (
    correct_id INT PRIMARY KEY,
    attendance_id VARCHAR(20) NOT NULL,
    reg_id INT NOT NULL,

    FOREIGN KEY (attendance_id)
    REFERENCES Attendance(attendance_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

    FOREIGN KEY (reg_id)
    REFERENCES Attendance_Regularization(reg_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);
