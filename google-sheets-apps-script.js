const SHEET_NAME = "RSVPs";
const HEADERS = ["Submitted At", "Full Name", "Email", "Phone", "Attendance"];

function getRsvpSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }

  return sheet;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function findConfirmedRsvp(sheet, payload) {
  const fullName = normalizeText(payload.full_name);
  const rows = sheet.getDataRange().getValues();

  for (let index = 1; index < rows.length; index += 1) {
    const rowName = normalizeText(rows[index][1]);

    if (rowName === fullName) {
      return true;
    }
  }

  return false;
}

function listRsvps(sheet) {
  const rows = sheet.getDataRange().getValues();

  return rows.slice(1).reverse().map((row) => ({
    created_at: row[0] || "",
    full_name: row[1] || "",
    email: row[2] || "",
    phone: row[3] || "",
    attendance: row[4] || "",
  }));
}

function doPost(event) {
  try {
    const sheet = getRsvpSheet();
    const payload = JSON.parse(event.postData.contents);

    if (payload.action === "check") {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, confirmed: findConfirmedRsvp(sheet, payload) }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (payload.action === "list") {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, rows: listRsvps(sheet) }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    sheet.appendRow([
      payload.created_at || new Date().toISOString(),
      payload.full_name || "",
      payload.email || "",
      payload.phone || "",
      payload.attendance || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
