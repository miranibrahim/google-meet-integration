/**
 * RUN THIS ONCE to get your refresh token.
 * Then store the token in .env as GOOGLE_REFRESH_TOKEN=...
 *
 * Usage:
 *   node get-refresh-token.js
 */

require("dotenv").config();
const { google } = require("googleapis");
const http = require("http");
const url = require("url");

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3001/callback" // temp port just for this script
);

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar",
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  prompt: "consent", // forces refresh_token to be returned
  scope: SCOPES,
});

console.log("\n========================================");
console.log("  STEP 1: Open this URL in your browser");
console.log("========================================");
console.log("\n" + authUrl + "\n");
console.log("Waiting for Google to redirect back...\n");

// Temporary server to catch the callback
const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (!parsed.pathname.startsWith("/callback")) return;

  const code = parsed.query.code;
  if (!code) {
    res.end("No code received.");
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.end(`
      <h2 style="font-family:sans-serif;color:green">✅ Success! Check your terminal.</h2>
      <p style="font-family:monospace">You can close this tab.</p>
    `);

    console.log("========================================");
    console.log("  STEP 2: Copy this into your .env file");
    console.log("========================================");
    console.log("\nGOOGLE_REFRESH_TOKEN=" + tokens.refresh_token + "\n");

    if (!tokens.refresh_token) {
      console.log("⚠️  No refresh_token returned.");
      console.log("   Go to https://myaccount.google.com/permissions");
      console.log("   Revoke access for your app, then run this script again.\n");
    } else {
      console.log("✅ Done! Add the above line to your .env and run: npm start\n");
    }
  } catch (err) {
    res.end("Error: " + err.message);
    console.error("Error getting tokens:", err.message);
  } finally {
    server.close();
  }
});

server.listen(3001, () => {
  console.log("(Temporary auth server listening on port 3001)");
});
