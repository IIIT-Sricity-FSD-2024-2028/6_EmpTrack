const escalationsData = [
  {
    employeeName: "John Doe",
    taskId: "TK001",
    taskTitle: "Frontend Layout",
    progress: "40%",
    hours: "4/10",
    reason: "Low progress"
  },
  {
    employeeName: "Sarah Johnson",
    taskId: "TK002",
    taskTitle: "API Integration",
    progress: "30%",
    hours: "3/10",
    reason: "Delayed API"
  },
  {
    employeeName: "Mike Davis",
    taskId: "TK003",
    taskTitle: "Bug Fixing",
    progress: "20%",
    hours: "2/8",
    reason: "Too many defects"
  },
  {
    employeeName: "Emma Wilson",
    taskId: "TK004",
    taskTitle: "Testing",
    progress: "10%",
    hours: "1/8",
    reason: "Not started properly"
  },
  {
    employeeName: "James Brown",
    taskId: "TK005",
    taskTitle: "Documentation",
    progress: "45%",
    hours: "5/10",
    reason: "Slow progress"
  }
];

function renderEscalations() {
  const table = document.querySelector("table tbody");
  if (!table) return;

  table.innerHTML = "";

  const localData = JSON.parse(localStorage.getItem("escalations")) || [];
  const mergedData = [...escalationsData, ...localData];

  mergedData.forEach(task => {
    const row = `
      <tr>
        <td>${task.employeeName}</td>
        <td>${task.taskId}</td>
        <td>${task.taskTitle}</td>
        <td>${task.progress}</td>
        <td>${task.hours}</td>
        <td>${task.reason}</td>
        <td>
          <button onclick="alert('Warning Sent')">Warn</button>
          <button onclick="alert('Deadline Extended')">Extend</button>
          <button onclick="alert('Reassigned')">Reassign</button>
        </td>
      </tr>
    `;
    table.innerHTML += row;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderEscalations();

  const quickActionsContainer = document.getElementById("quick-actions-container");
  if (quickActionsContainer) {
    quickActionsContainer.addEventListener("click", (e) => {
      const card = e.target.closest("[data-action]");
      if (!card) return;

      const action = card.getAttribute("data-action");
      console.log(`Quick action clicked: ${action}`);

      if (action === "warn") {
        alert("Warning email drafted successfully");
      } else if (action === "extend") {
        const newDeadline = prompt("Enter new deadline:");
        if (newDeadline) {
          console.log(`Deadline extended to: ${newDeadline}`);
          alert("Deadline extended successfully");
        }
      } else if (action === "reassign") {
        const employeeName = prompt("Enter employee name:");
        if (employeeName) {
          console.log(`Task reassigned to: ${employeeName}`);
          alert("Task reassigned successfully to " + employeeName);
        }
      }
    });
  }
});
