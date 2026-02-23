# ARIA — AI Teaching Assistant
### Advanced Reasoning & Interactive Assistant

A production-ready AI-powered teaching platform that simulates a real classroom experience. ARIA teaches step-by-step on a virtual whiteboard — writing equations and code line-by-line, explaining every detail thoroughly, and pausing to ensure comprehension before moving forward.

---

## ✨ What Makes ARIA Different

Unlike AI chatbots that dump complete answers instantly, ARIA **teaches progressively**:

1. **Writes** equations/code step-by-step on the whiteboard (max 4 lines per step)
2. **Explains** each step thoroughly (5-8 sentence minimum explanations)
3. **Speaks** the explanation aloud via TTS
4. **Pauses** for reading time before the next step
5. **Visualizes** concepts with animated concept maps and flow diagrams

---

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org))
- A free Groq API key ([get one here](https://console.groq.com))

### Step 1: Get a Groq API Key
1. Go to [console.groq.com](https://console.groq.com)
2. Sign up (free, no credit card needed)
3. Generate an API key (starts with `gsk_`)

### Step 2: Set up the Backend
```bash
cd backend
cp .env.example .env
# Edit .env and paste your GROQ_API_KEY
npm install
npm run dev
```
Backend runs on `http://localhost:5000`

### Step 3: Set up the Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### Step 4: Open ARIA
Navigate to **http://localhost:5173** in Chrome or Edge (required for voice features).

---

## 🎙️ Voice Features

| Feature | Browser | Notes |
|---------|---------|-------|
| Voice Input (STT) | Chrome/Edge only | Web Speech API |
| Voice Output (TTS) | All modern browsers | ElevenLabs or browser fallback |
| Hindi Support | Chrome/Edge | Auto-detected from script |

**Click the glowing orb** to start speaking. ARIA will transcribe your question and respond.

---

## 📊 Features

### Whiteboard Teaching Engine
- **Progressive reveal**: Lines appear instantly, explanations type out character-by-character
- **Math rendering**: KaTeX renders LaTeX formulas beautifully
- **Syntax highlighting**: Code is color-coded automatically
- **Auto-scroll**: Always follows the current step
- **Interrupt**: Stop the animation at any time

### AI Responses
- **Speech text**: Short, natural TTS-friendly explanation
- **Display text**: Full markdown response with code blocks, math, lists
- **Whiteboard steps**: Structured teaching progression (2-6+ steps)
- **Visualizations**: Concept maps and flow diagrams where helpful

### Bilingual Support
- Auto-detects Hindi from Devanagari script
- Language toggle in header
- ElevenLabs multilingual voices
- Both English and Hindi UI elements

---

## ⚙️ Configuration

### Backend `.env` Options

```env
# REQUIRED
GROQ_API_KEY=gsk_...

# OPTIONAL
GROQ_MODEL=llama-3.3-70b-versatile    # Best quality (default)
# GROQ_MODEL=deepseek-r1-distill-llama-70b  # Best for math/reasoning
# GROQ_MODEL=llama-3.1-8b-instant          # Fastest responses

PORT=5000
FRONTEND_URL=http://localhost:5173

# Premium TTS (optional - browser TTS used if not set)
ELEVENLABS_API_KEY=your_key_here
```

### ElevenLabs TTS (Optional)
Without ElevenLabs, ARIA uses the browser's built-in speech synthesis. To enable premium neural voices:
1. Sign up at [elevenlabs.io](https://elevenlabs.io)
2. Get your API key
3. Add `ELEVENLABS_API_KEY=...` to backend `.env`

---

## 📦 Production Deployment

### Backend (Node.js)
```bash
cd backend
npm install --production
npm start
```

Deploy to: Heroku, Railway, Render, DigitalOcean, etc.

### Frontend (Static)
```bash
cd frontend
npm run build
# Serve the dist/ folder
```

Deploy to: Vercel, Netlify, Cloudflare Pages, etc.

### Important: HTTPS for Voice
Voice features (microphone access) require HTTPS in production. All major hosting providers offer free HTTPS.

### Environment for Production
```env
# backend/.env
FRONTEND_URL=https://your-frontend-domain.com
```

---

## 🗂️ Project Structure

```
aria-edtech/
├── backend/
│   ├── server.js              # Express server, CORS, rate limiting
│   ├── routes/
│   │   ├── chat.js            # Groq API integration
│   │   ├── tts.js             # ElevenLabs TTS + browser fallback
│   │   └── health.js          # Service status check
│   ├── utils/
│   │   └── systemPrompt.js    # ARIA teaching persona & JSON format
│   ├── .env.example           # Environment template
│   └── package.json
│
└── frontend/
    ├── index.html             # KaTeX CDN, Google Fonts
    ├── vite.config.js         # Vite + API proxy
    └── src/
        ├── main.jsx           # React entry
        ├── App.jsx            # Main layout, state, API calls
        ├── hooks/
        │   └── useVoice.js    # TTS + STT with ElevenLabs/browser
        └── components/
            ├── Whiteboard.jsx     # Step-by-step animation engine
            ├── MessageBubble.jsx  # Markdown + LaTeX rendering
            ├── VoiceOrb.jsx       # Animated microphone button
            └── viz/
                ├── ConceptMap.jsx # SVG concept map
                └── FlowViz.jsx    # SVG flow diagram
```

---

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "401 Unauthorized" | Check `GROQ_API_KEY` in `backend/.env`. Must start with `gsk_` |
| "429 Rate Limited" | Wait 1 minute. Free tier = 30 req/min |
| Voice not working | Use Chrome or Edge. Enable microphone permissions |
| Math not rendering | Reload the page (KaTeX CDN may be slow to load) |
| Slow responses | Try `llama-3.1-8b-instant` model in `.env` |
| CORS errors | Check `FRONTEND_URL` in `backend/.env` matches your frontend URL |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| AI Model | Groq + Llama 3.3 70B | Fast, high-quality responses |
| Backend | Node.js + Express | API server |
| Frontend | React 18 + Vite | UI framework |
| Math | KaTeX | LaTeX formula rendering |
| TTS | ElevenLabs / Browser | Text-to-speech |
| STT | Web Speech API | Speech recognition |
| Security | Helmet + CORS + Rate Limit | Production hardening |

---

## 📝 License

Free for personal, educational, and non-commercial use. Attribution required for commercial use.

---

## 🙏 Credits

- [Groq](https://groq.com) — Ultra-fast LLM inference
- [Meta Llama](https://llama.meta.com) — Language model
- [ElevenLabs](https://elevenlabs.io) — Neural TTS
- [KaTeX](https://katex.org) — Math rendering
- Inspired by Khan Academy's teaching methodology

---

**Version:** 3.0.0 | **Status:** Production Ready | **Node.js:** 18+
