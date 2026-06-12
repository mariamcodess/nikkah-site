import {
  googleSheetsRequest,
  normalizeText,
  readBody,
  requireEnv,
  requirePost,
  sendJson,
} from "./_utils.js";

export default async function handler(request, response) {
  if (!requirePost(request, response)) return;

  try {
    requireEnv(["SITE_PASSWORD"]);
    const body = await readBody(request);
    const fullName = normalizeText(body.fullName);
    const password = String(body.password || "").trim();

    if (!fullName || !password) {
      sendJson(response, 400, { error: "Please enter your full name and guest password." });
      return;
    }

    if (password !== process.env.SITE_PASSWORD.trim()) {
      sendJson(response, 401, { error: "That password did not match. Please try again." });
      return;
    }

    if (!process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
      const host = request.headers.host || "";
      const isLocalPreview = host.startsWith("localhost:") || host.startsWith("127.0.0.1:");
      sendJson(response, isLocalPreview ? 200 : 500, {
        confirmed: isLocalPreview,
        storage: "local_preview",
        error: isLocalPreview ? undefined : "RSVP lookup is not configured yet.",
      });
      return;
    }

    const result = await googleSheetsRequest({
      action: "check",
      full_name: fullName,
    });

    sendJson(response, 200, { confirmed: Boolean(result.confirmed) });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}
