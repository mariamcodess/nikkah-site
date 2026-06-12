import { readBody, requireEnv, requirePost, sendJson } from "./_utils.js";

export default async function handler(request, response) {
  if (!requirePost(request, response)) return;

  try {
    requireEnv(["SITE_PASSWORD"]);
    const { password } = await readBody(request);

    if (String(password || "").trim() !== process.env.SITE_PASSWORD.trim()) {
      sendJson(response, 401, { error: "Invalid password" });
      return;
    }

    sendJson(response, 200, { ok: true });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
}
