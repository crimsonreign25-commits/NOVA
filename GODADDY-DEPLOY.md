# Deploying NOVA to GoDaddy Node.js Hosting

This zip has NO .env file in it on purpose — your Groq key should never be
uploaded inside the zip itself. Instead, you'll paste it into GoDaddy's
environment variable settings, which keeps it out of the uploaded files.

## Steps

1. Go to godaddy.com → **Hosting** → **Node.js Hosting** and sign up
   (free to start, no card needed for the free tier).
2. Create a new app, choose **Upload zip** as the source.
3. Upload this zip file.
4. In the app's **Environment Variables** section, add:
   ```
   OPENAI_API_KEY = your-groq-key-here
   OPENAI_BASE_URL = https://api.groq.com/openai/v1
   NOVA_MODEL = llama-3.3-70b-versatile
   NOVA_PROVIDER = auto
   PORT = 8787
   ```
   (Use your real Groq key from console.groq.com — the one you already
   generated. Don't reuse a key you've pasted in a chat if you want to be
   extra safe; regenerating a fresh one takes 10 seconds.)
5. GoDaddy auto-detects this is an Express app and runs it with `npm start`.
   It installs dependencies from `package.json` automatically.
6. Deploy. You'll get a live URL with SSL already on.

## After it's live

- Visit the URL, send NOVA a message, confirm you get a real AI reply.
- That URL is now your public NOVA — reachable by anyone who has it, and
  what your Android phone (via Termux/Tasker, step 5 from before) will call
  into once we build that layer.
