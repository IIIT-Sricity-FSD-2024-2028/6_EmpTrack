# Domain Expert Interaction Summary

This document records the interaction with the domain expert for the **Attendance, Leave and Work Allocation Platform** project.
 
---
## Basic Information

* **Domain:** Human Resource and Staff Administration
* **Problem Statement:**
  Design and development of an integrated system to manage employee attendance, leave requests, work allocation, approvals, policy enforcement, and reporting for employees, team leads, and HR.
* **Date of Interaction:** 31/01/2026
* **Mode of Interaction:** Video Call (Google Meet)
* **Duration (in minutes):** 30 minutes
* **Publicly Accessible Video Link:** https://drive.google.com/file/d/11S8wPIu9DFUBC4YTEIXaPcdHb_7LiDEo/view?usp=sharing

---

## Domain Expert Details

* **Role / Designation:** Manager (Project Technical Manager)
* **Experience in the Domain:**
  19 years of experience in the IT industry, currently working at Cognizant (CTS), Chennai. The expert has extensive experience in managing technical teams, overseeing attendance and leave processes, allocating work, and ensuring compliance with organizational policies.
* **Nature of Work:** Managerial

---

## Domain Context and Terminology

### Purpose of the Problem Statement in Daily Work

The purpose of this system is to ensure transparent tracking of employee attendance, structured leave approvals, effective task allocation, and accurate reporting to improve productivity, accountability, and compliance with company policies.

### Primary Goals / Outcomes

* Accurate attendance tracking
* Streamlined leave approval process
* Efficient work allocation and monitoring
* Reduced manual effort and errors
* Centralized reporting for management and HR

---

## Key Terms Used by the Domain Expert

| Term                      | Meaning as explained by the expert                                 |
| ------------------------- | ------------------------------------------------------------------ |
| Attendance Regularization | Process of correcting incorrect or missed attendance entries       |
| Leave Approval            | Authorization given by a team lead or HR for employee leave        |
| Escalation                | Forwarding an issue to HR in case of disputes or policy violations |
| Work Allocation           | Assigning tasks to employees based on role and workload            |
| Policy Enforcement        | Applying company rules related to attendance and leave             |

---

## Actors and Responsibilities

| Actor / Role | Responsibilities                                                              |
| ------------ | ----------------------------------------------------------------------------- |
| Employee     | Marks attendance, applies for leave, updates task status                      |
| Team Lead    | Monitors attendance, approves/rejects leave, assigns and tracks tasks         |
| HR           | Defines policies, handles escalations, resolves complaints, generates reports |
| System       | Stores data, applies rules, sends notifications, generates reports            |

---

## Core Workflows

### Workflow 1: Attendance Management

* **Trigger / Start Condition:** Employee marks attendance or submits a regularization request

**Steps Involved:**

1. Employee marks attendance in the system
2. Employee submits attendance regularization if required
3. System forwards request to Team Lead
4. Team Lead approves or rejects the request
5. HR rules are applied if escalation is required

* **Outcome / End Condition:** Attendance record updated and employee notified

---

### Workflow 2: Leave Management

* **Trigger / Start Condition:** Employee applies for leave

**Steps Involved:**

1. Employee submits leave request
2. System notifies Team Lead
3. Team Lead approves or rejects leave
4. In emergency or conflict cases, request is escalated to HR
5. HR reviews and takes final decision

* **Outcome / End Condition:** Leave status updated and employee informed

---

### Workflow 3: Work Allocation

* **Trigger / Start Condition:** New project task or workload adjustment

**Steps Involved:**

1. Team Lead assigns tasks to employees
2. System notifies employees
3. Employees update task progress
4. Team Lead monitors completion status

* **Outcome / End Condition:** Task completion and productivity tracking

---

## Rules, Constraints, and Exceptions

### Mandatory Rules or Policies

* Attendance must comply with defined working hours
* Leave approval is mandatory before absence

### Constraints or Limitations

* Leave balances limit approvals
* System access based on user roles

### Common Exceptions or Edge Cases

* Emergency leave without prior approval
* Missed attendance due to system or network issues

### Situations Where Things Usually Go Wrong

* Delayed approvals
* Incorrect attendance entries

---

## Current Challenges and Pain Points

* Manual follow-ups for approvals
* Difficulty in tracking corrections and escalations
* Lack of centralized visibility for reports
* Dependency on emails and spreadsheets

---

## Assumptions & Clarifications

### Assumptions Confirmed

* Team Leads handle most approvals
* HR intervenes only in escalations and policy violations

### Assumptions Corrected

* Attendance correction is not automatic; approval is mandatory

---

## Open Questions for Follow-up

* Automation level for report scheduling
* Is automated task reassignment required in emergencies?
