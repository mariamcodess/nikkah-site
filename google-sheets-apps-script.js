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

function doPost(event) {
  try {
    const sheet = getRsvpSheet();
    const payload = JSON.parse(event.postData.contents);

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
