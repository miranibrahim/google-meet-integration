require("dotenv").config();
const express = require("express");
const { google } = require("googleapis");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ── OAuth2 client — auto-authenticated from .env ─────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/auth/callback",
);

// Set the stored refresh token from .env — no user login needed
if (process.env.GOOGLE_REFRESH_TOKEN) {
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
  console.log("✅ Google auth loaded from .env (refresh token)");
} else {
  console.warn("⚠️  GOOGLE_REFRESH_TOKEN not set in .env");
  console.warn("   Run: node get-refresh-token.js");
}

// Auto-refresh access token when it expires
oauth2Client.on("tokens", (tokens) => {
  if (tokens.refresh_token) {
    console.log("🔄 New refresh token received — update .env if needed");
  }
});

// ── Single endpoint: create meet link ────────────────────────────────────────
app.post("/api/create-meet", async (req, res) => {
  if (!process.env.GOOGLE_REFRESH_TOKEN) {
    return res.status(500).json({
      error: "Server not configured. GOOGLE_REFRESH_TOKEN missing in .env",
    });
  }

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const start = new Date();
  const end = new Date(start);
  end.setHours(end.getHours() + 1);

  const event = {
    summary: "Instant Meet",
    start: { dateTime: start.toISOString(), timeZone: "UTC" },
    end: { dateTime: end.toISOString(), timeZone: "UTC" },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    const meetLink =
      response.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video",
      )?.uri || null;

    if (!meetLink) {
      return res.status(500).json({ error: "Meet link not generated." });
    }

    console.log("✅ Meet link created:", meetLink);
    res.json({ meetLink });
  } catch (err) {
    console.error("Calendar API error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}\n`);
});
