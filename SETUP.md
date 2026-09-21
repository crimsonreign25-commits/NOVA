# NOVA — Connect the AI (Free, No Card) + Go Live

Your NOVA code already has real OpenAI/Ollama wiring built in (see `index.js`:
`openAIProvider()`, `ollamaChat()`, `generateReasoning()`). Nothing needs to be
coded to "connect the AI" — it just needs credentials in a `.env` file.

## Step 1 — Get a free Groq key

1. Go to https://console.groq.com and sign up (no credit card required).
2. Click **API Keys** → **Create API Key**.
3. Copy the key (starts with `gsk_...`).

## Step 2 — Configure NOVA

1. Copy `.env.example` to `.env`:
   ```
   cp .env.example .env
   ```
2. Open `.env` and paste your Groq key into `OPENAI_API_KEY`.
   Leave `OPENAI_BASE_URL` and `NOVA_MODEL` as they are — that's what points
   NOVA at Groq's free Llama 3.3 70B model using the OpenAI-compatible API.

## Step 3 — Run it locally to confirm it works

```
npm install
npm run dev
```

This starts the Express backend (port 8787) and the Vite frontend together.
Open the frontend URL it prints, send a chat message, and you should get a
real AI reply. You can also check directly:

```
curl http://localhost:8787/api/health
curl http://localhost:8787/api/nova/providers
```

`providers` should show Groq as the active reasoning engine once the key is
in place.

## Step 4 — Deploy so it's reachable online

**Render (recommended, free tier):**
1. Push this project to a GitHub repo.
2. On https://render.com → **New** → **Web Service** → connect the repo.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables in Render's dashboard (same as your `.env`:
   `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `NOVA_MODEL`, `NOVA_PROVIDER`).
6. Deploy. Render gives you a public URL like `https://nova-xxxx.onrender.com`.

Once that's live, anyone (including you from your phone's browser) can reach
NOVA at that URL — this is the "public" side.

## Step 5 — Phone side (Android, Jarvis-style)

This is a separate build from the AI wiring above — it's about giving your
phone hooks into NOVA's API (Termux + Tasker), not about the AI itself.
We'll do this once steps 1–4 are confirmed working, so NOVA has a stable
public URL for your phone to call.
