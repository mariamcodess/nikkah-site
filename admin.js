const adminForm = document.getElementById("admin-form");
const adminPassword = document.getElementById("admin-password");
const adminError = document.getElementById("admin-error");
const adminLogin = document.getElementById("admin-login");
const tablePanel = document.getElementById("admin-table-panel");
const tableBody = document.getElementById("rsvp-table-body");
const adminMessage = document.getElementById("admin-message");

function formatAttendance(value) {
  if (value === "attending") return "Attending";
  if (value === "not_attending") return "Not attending";
  return value || "";
}

function renderRows(rows) {
  tableBody.textContent = "";

  if (!rows.length) {
    tableBody.innerHTML = '<tr><td colspan="5">No RSVP submissions yet.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    const submitted = row.created_at ? new Date(row.created_at).toLocaleString() : "";
    [row.full_name, row.email, row.phone, formatAttendance(row.attendance), submitted].forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value || "";
      tr.appendChild(td);
    });
    tableBody.appendChild(tr);
  });
}

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  adminError.textContent = "";
  adminMessage.textContent = "Loading RSVPs...";

  try {
    const response = await fetch("/api/admin-rsvps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword.value }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || "Unable to load RSVP submissions");
    }

    adminLogin.classList.add("hidden");
    tablePanel.classList.remove("hidden");
    renderRows(result.rows || []);
    adminMessage.textContent = `${result.rows?.length || 0} RSVP submission(s) loaded.`;
  } catch (error) {
    adminMessage.textContent = "";
    adminError.textContent = error.message || "Something went wrong. Please try again.";
    adminPassword.select();
  }
});
