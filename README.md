# 🎓 ARIA — AI Teaching Assistant  
### Advanced Reasoning & Interactive Classroom Experience

<p align="center">
  <b>ARIA doesn’t just answer — it teaches.</b><br/>
  Step-by-step explanations • Virtual whiteboard • Voice interaction • Visual learning
</p>

<p align="center">
  <img src="https://github.com/Gagansoni485/ARIA-edtech/blob/main/Screenshot%202026-02-27%20115658.png?raw=true" />
  <img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge" />
</p>

---

# 🖼️ Preview

## 🧠 Virtual Whiteboard Teaching
![Whiteboard Preview](./assets/whiteboard.png)

## 🎙️ Voice Interaction Interface
![Voice UI Preview](./assets/voice-ui.png)

> 📌 Replace image paths with your actual screenshot paths  
> Example: `./screenshots/dashboard.png`

---

# ✨ What Makes ARIA Different?

Unlike traditional AI chatbots that provide instant full answers, ARIA simulates a **real classroom teaching process**:

| Feature | Traditional AI | ARIA |
|----------|----------------|------|
| Step-by-step explanation | ❌ | ✅ |
| Whiteboard writing | ❌ | ✅ |
| Voice explanation | ❌ | ✅ |
| Pause for understanding | ❌ | ✅ |
| Concept visualization | ❌ | ✅ |

ARIA follows a structured teaching methodology:

1. ✍️ Writes equations/code (max 4 lines per step)  
2. 📖 Explains thoroughly (5–8 sentence explanations)  
3. 🔊 Speaks explanation via TTS  
4. ⏸️ Pauses for reading time  
5. 🧩 Visualizes concepts with diagrams  

---

# 🚀 Quick Start (5 Minutes)

## 📌 Prerequisites

- Node.js 18+ → https://nodejs.org  
- Free Groq API Key → https://console.groq.com  

---

## 🔐 Step 1: Get Groq API Key

1. Visit https://console.groq.com  
2. Sign up (Free tier available)  
3. Generate API key (`gsk_...`)

---

## 🖥️ Step 2: Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
GROQ_API_KEY=gsk_...
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Run backend:

```bash
npm run dev
```

Backend runs on:
```
http://localhost:5000
```

---

## 🎨 Step 3: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```
http://localhost:5173
```

---

# 🎙️ Voice Features

| Feature | Support | Notes |
|----------|---------|-------|
| 🎤 Voice Input (STT) | Chrome / Edge | Uses Web Speech API |
| 🔊 Voice Output (TTS) | All modern browsers | ElevenLabs or browser fallback |
| 🌐 Hindi Support | Chrome / Edge | Auto-detected |

👉 Click the glowing orb to start speaking.

---

# 📊 Core Features

## 🧠 Whiteboard Teaching Engine

- Progressive line reveal
- Character-by-character explanation typing
- KaTeX math rendering
- Syntax highlighted code
- Auto-scroll to current step
- Interrupt animation anytime

---

## 🤖 AI Response Structure

ARIA responses are divided into:

| Section | Purpose |
|----------|----------|
| Speech Text | Short TTS-friendly response |
| Display Text | Full Markdown explanation |
| Whiteboard Steps | Structured learning flow |
| Visualizations | Concept maps / Flow diagrams |

---

# 🌍 Bilingual Support

- Auto-detects Hindi (Devanagari script)
- Language toggle in UI
- Multilingual TTS
- English & Hindi UI elements

---

# ⚙️ Configuration

## 🔧 Backend `.env`

```env
# REQUIRED
GROQ_API_KEY=gsk_...

# OPTIONAL MODEL CONFIG
GROQ_MODEL=llama-3.3-70b-versatile
# GROQ_MODEL=deepseek-r1-distill-llama-70b
# GROQ_MODEL=llama-3.1-8b-instant

PORT=5000
FRONTEND_URL=http://localhost:5173

# Optional Premium TTS
ELEVENLABS_API_KEY=your_key_here
```

---

# 🏗️ Architecture

```
User (Voice/Text)
        ↓
Frontend (React + Vite)
        ↓
Backend (Node + Express)
        ↓
Groq API (Llama 3.3 70B)
        ↓
Structured Teaching Response
        ↓
Whiteboard + TTS + Visualization
```

---

# 📦 Production Deployment

## Frontend Build

```bash
cd frontend
npm run build
```

Deploy `/dist` folder to:
- Vercel
- Netlify
- Firebase
- AWS

---

## ⚠️ Important: HTTPS Required

Voice features require **HTTPS** in production.

All major hosting providers provide free SSL.

---

# 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|------------|----------|
| AI Model | Groq + Llama 3.3 70B | Fast LLM inference |
| Backend | Node.js + Express | API server |
| Frontend | React 18 + Vite | UI framework |
| Math Rendering | KaTeX | LaTeX support |
| TTS | ElevenLabs / Browser | Speech synthesis |
| STT | Web Speech API | Speech recognition |
| Security | Helmet + CORS + Rate Limit | Production hardening |

---

# 🔧 Troubleshooting

| Problem | Solution |
|----------|----------|
| 401 Unauthorized | Check `GROQ_API_KEY` |
| 429 Rate Limited | Wait 60 seconds |
| Voice not working | Use Chrome/Edge & allow mic |
| Math not rendering | Reload page |
| CORS error | Check `FRONTEND_URL` |

---

# 📈 Future Enhancements

- 🧪 Quiz Mode  
- 📊 Learning Analytics  
- 👨‍🏫 Multi-teacher support  
- 🧠 Memory-based personalized learning  
- 📱 Mobile app version  

---

# 📝 License

Free for personal & educational use.  
Attribution required for commercial use.

---

# 🙏 Credits

- Groq — Ultra-fast LLM inference  
- Meta Llama — Language model  
- ElevenLabs — Neural TTS  
- KaTeX — Math rendering  

---

<p align="center">
  <b>ARIA — Because AI Should Teach, Not Just Answer.</b>
</p>
