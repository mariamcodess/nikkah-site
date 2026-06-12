import {
  googleSheetsRequest,
  normalizeDisplayText,
  readBody,
  requireEnv,
  requirePost,
  sendJson,
  supabaseRequest,
} from "./_utils.js";

const allowedAttendance = new Set(["attending", "not_attending"]);

export default async function handler(request, response) {
  if (!requirePost(request, response)) return;

  try {
    requireEnv(["SITE_PASSWORD"]);
    const guestPassword = request.headers["x-site-password"];

    if (String(guestPassword || "").trim() !== process.env.SITE_PASSWORD.trim()) {
      sendJson(response, 401, { error: "This RSVP form is invite only." });
      return;
    }

    const body = await readBody(request);
    const fullName = normalizeDisplayText(body.fullName);
    const email = String(body.email || "").trim();
    const phone = String(body.phone || "").trim();
    const attendance = String(body.attendance || "").trim();

    if (!fullName || !email || !phone || !allowedAttendance.has(attendance)) {
      sendJson(response, 400, { error: "Please complete every RSVP field." });
      return;
    }

    const row = {
      full_name: fullName,
      email,
      phone,
      attendance,
      created_at: new Date().toISOString(),
    };

    if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      await googleSheetsRequest(row);
      sendJson(response, 200, { ok: true, storage: "google_sheets" });
      return;
    }

    const host = request.headers.host || "";
    const isLocalPreview = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");

    if (isLocalPreview && !process.env.SUPABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      sendJson(response, 200, { ok: true, storage: "local_preview", row });
      return;
    }

    const rows = await supabaseRequest("rsvps", {
      method: "POST",
      body: JSON.stringify(row),
    });

    sendJson(response, 200, { ok: true, storage: "supabase", row: rows?.[0] });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}
