# 🎙️ VoiceNote AI

> Record voice notes → get instant AI transcription + smart summaries with action items.

**Live demo:** `https://github.com/Sachiinss04/AI-voice-note-summarizer.git`

---

## ✨ Features

- **🎙 Browser recording** — Record directly in-browser via microphone
- **📂 File upload** — Upload MP3, WAV, M4A, WebM audio files
- **✏️ Text input** — Paste any transcript or notes
- **🤖 Claude AI summaries** — Extracts TL;DR, key points, action items, sentiment
- **🔊 Text-to-speech** — Reads the summary back to you
- **☑️ Interactive checklist** — Check off action items as you complete them
- **🎨 4 tone modes** — Professional, Concise, Casual, Detailed
- **🌑 Dark theme** — Designed for long sessions

---

## 🚀 Deploy to GitHub Pages (5 minutes)

### Step 1 — Fork or create repo

```bash
# Option A: Clone this repo
git clone https://github.com/YOUR-USERNAME/voice-note-ai.git
cd voice-note-ai

# Option B: Create fresh
mkdir voice-note-ai && cd voice-note-ai
git init
```

### Step 2 — Add the files

Make sure your repo contains:
```
voice-note-ai/
├── index.html
├── style.css
├── app.js
└── README.md
```

### Step 3 — Push to GitHub

```bash
git add .
git commit -m "feat: initial VoiceNote AI"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/voice-note-ai.git
git push -u origin main
```

### Step 4 — Enable GitHub Pages

1. Go to your repo on GitHub
2. Click **Settings** → **Pages**
3. Under **Source**, select `main` branch → `/ (root)`
4. Click **Save**
5. Your site is live at `https://YOUR-USERNAME.github.io/voice-note-ai` ✅

---

## 🔑 Getting a Claude API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / log in
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)
5. Paste it into the app's API key field

> **Security note:** Your API key is stored only in your browser's sessionStorage and never sent anywhere except directly to Anthropic's API.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML, CSS, JavaScript |
| AI Summaries | [Claude API](https://docs.anthropic.com) (claude-sonnet) |
| Speech-to-text | Web Speech API (browser native) |
| Text-to-speech | Web Speech Synthesis API |
| Hosting | GitHub Pages |
| Fonts | DM Serif Display, Syne, DM Mono |

---

## 🔮 Upgrade Ideas

- **Whisper API** — Replace Web Speech API with OpenAI Whisper for better accuracy on uploaded files
- **AssemblyAI** — Real-time transcription with speaker diarization
- **Export to Notion / Obsidian** — Send action items directly to your notes app
- **Email digest** — Send daily summary of all notes
- **Backend** — Add Node.js/Python backend to keep API key server-side

---

## 📁 Project Structure

```
index.html   — Full page structure (nav, hero, app, footer)
style.css    — All styles (dark theme, responsive, animations)
app.js       — All logic (recording, Claude API, render, TTS)
README.md    — This file
```

---

## 📄 License

MIT — use freely, credit appreciated.

---

**Resume line:**
> Developed a voice-driven AI tool that transcribes and summarizes spoken notes using speech recognition and LLMs (Claude API), deployed as a static site on GitHub Pages.
