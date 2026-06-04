# Google Meet Link Generator — POC

A Node.js proof-of-concept that generates real Google Meet links via the **Google Calendar API**.

---

## How it works

1. User clicks **Sign in with Google** → OAuth2 consent screen
2. Google redirects back with an auth code → tokens stored in memory
3. User clicks **Generate Meet Link** → server creates a Calendar event with `conferenceData`
4. Google returns a real `meet.google.com/xxx-xxxx-xxx` link
5. User clicks **Join Now** → opens the meeting

---

## Setup

### 1. Create Google Cloud credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Calendar API**: APIs & Services → Library → search "Google Calendar API" → Enable
4. Create OAuth2 credentials:
   - APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/auth/callback`
5. Copy your **Client ID** and **Client Secret**

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:
```
GOOGLE_CLIENT_ID=your_actual_client_id
GOOGLE_CLIENT_SECRET=your_actual_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
PORT=3000
```

### 3. Install & run

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
google-meet-poc/
├── server.js          # Express server + Google API logic
├── public/
│   └── index.html     # Frontend UI
├── .env.example       # Environment variables template
├── .env               # Your actual secrets (gitignored)
└── package.json
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/auth/login` | GET | Redirects to Google OAuth consent |
| `/auth/callback` | GET | Handles OAuth redirect, stores tokens |
| `/api/auth-status` | GET | Returns `{ authenticated: true/false }` |
| `/api/create-meet` | POST | Creates Calendar event, returns Meet link |

---

## Notes

- Tokens are stored **in memory** — they reset on server restart. For production, store in a database or session.
- The Calendar event is created starting 5 minutes from now, lasting 1 hour.
- `conferenceDataVersion: 1` is required to auto-generate the Meet link.
