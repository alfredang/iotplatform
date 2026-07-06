#!/usr/bin/env node
/**
 * One-time helper to mint a Gmail OAuth2 REFRESH TOKEN for sending email.
 *
 * Prereqs (Google Cloud Console, https://console.cloud.google.com):
 *   1. APIs & Services → OAuth consent screen: configure (External is fine),
 *      add your Gmail address as a test user (or publish the app).
 *   2. APIs & Services → Credentials → Create credentials → OAuth client ID
 *      → Application type "Web application" → add redirect URI
 *      http://localhost:53682/oauth2callback
 *
 * Usage:
 *   node scripts/gmail-oauth.mjs <client_id> <client_secret>
 *
 * Then open the printed URL, consent with the Gmail account that will send
 * mail, and copy the refresh token into Admin → Settings → Gmail (OAuth2)
 * (or the GMAIL_* env vars).
 */
import http from "node:http";

const [clientId, clientSecret] = process.argv.slice(2);
if (!clientId || !clientSecret) {
  console.error("Usage: node scripts/gmail-oauth.mjs <client_id> <client_secret>");
  process.exit(1);
}

const PORT = 53682;
const REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SCOPE = "https://mail.google.com/";

const authUrl =
  "https://accounts.google.com/o/oauth2/v2/auth?" +
  new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
    access_type: "offline",
    prompt: "consent", // force a refresh_token even on re-consent
  });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (url.pathname !== "/oauth2callback") {
    res.writeHead(404).end();
    return;
  }
  const code = url.searchParams.get("code");
  if (!code) {
    res.writeHead(400).end("Missing ?code — consent may have been denied.");
    return;
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT,
        grant_type: "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.refresh_token) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end(`Token exchange failed:\n${JSON.stringify(tokens, null, 2)}`);
      console.error("Token exchange failed:", tokens);
      process.exit(1);
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h2>Done — refresh token printed in your terminal. You can close this tab.</h2>");

    console.log("\n=== Gmail OAuth2 credentials ===");
    console.log(`GMAIL_CLIENT_ID=${clientId}`);
    console.log(`GMAIL_CLIENT_SECRET=${clientSecret}`);
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log("\nPaste these into Admin → Settings → Gmail (OAuth2), or .env.");
    server.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

server.listen(PORT, () => {
  console.log("Open this URL in your browser and consent with the SENDING Gmail account:\n");
  console.log(authUrl + "\n");
  console.log(`Waiting for Google to redirect to ${REDIRECT} ...`);
});
