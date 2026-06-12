import { googleSheetsRequest, readBody, requireEnv, requirePost, sendJson } from "./_utils.js";

export default async function handler(request, response) {
  if (!requirePost(request, response)) return;

  try {
    requireEnv(["ADMIN_PASSWORD"]);
    const { password } = await readBody(request);

    if (String(password || "") !== process.env.ADMIN_PASSWORD) {
      sendJson(response, 401, { error: "Invalid admin password" });
      return;
    }

    const result = await googleSheetsRequest({
      action: "list",
    });

    sendJson(response, 200, { rows: result.rows || [] });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}
