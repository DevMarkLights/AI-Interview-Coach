# 🎯 AI Interview Coach
 
An AI-powered interview preparation tool that analyzes job descriptions and generates personalized interview questions, evaluates your answers in real time, and produces a final scorecard with hiring signal.
 
Built with **LangGraph**, **FastAPI**, **Ollama**, and **React** — self-hosted on a Raspberry Pi 5.
 
---
 
## Features
 
- **JD Analysis** — paste a job description or enter a URL; extracts role, seniority, tech stack, and interview focus areas
- **Multi-mode Question Generation** — generates targeted questions across behavioral, technical, system design, and role-specific categories in parallel via LangGraph fan-out
- **Real-time Answer Evaluation** — scores each answer with mode-specific rubrics (STAR for behavioral, accuracy/depth/relevance for technical, etc.)
- **Final Scorecard** — overall score, per-mode breakdown, hiring signal, top strengths and improvements

---

## Architecture
 
```
JD Input (paste or URL)
        ↓
  jd_analyzer_node          — extracts role metadata + interview focus areas
        ↓
dispatch_question_agents    — LangGraph Send fan-out
        ↓ ↓ ↓ ↓
  [behavioral] [technical] [system_design] [role_specific]   ← parallel
        ↓
   Interview Session         — one question at a time, user answers
        ↓
   evaluate_answer()         — per-answer scoring with mode-specific rubrics
        ↓
   generate_scorecard()      — final report with hiring signal
```

---

## Tech Stack
 
| Layer | Tech |
|---|---|
| Orchestration | LangGraph (multi-agent fan-out) |
| Backend | FastAPI |
| LLM (local) | Ollama — llama3.1:8b |
| LLM (prod) | Groq — llama-3.3-70b |
| Frontend | React |
| Scraping | httpx + BeautifulSoup |
| Infra | Raspberry Pi 5, Nginx, Cloudflare Tunnel |

---

## Speech Recognition Notes
Speech recognition requires:
- Chrome 25+
- Edge 79+
- Safari 26+

## Folder Structure
```
ai-interview-coach/
├── backend/
│   ├── main.py              # FastAPI + WebSocket
│   ├── graph/
│   │   ├── pipeline.py      # LangGraph graph definition
│   │   ├── agents/
│   │   │   ├── jd_analyzer.py
│   │   │   ├── question_generator.py
│   │   │   ├── evaluator.py
│   │   │   └── scorecard.py
│   │   └── state.py         # InterviewState TypedDict
│   └── utils/
│       └── scraper.py       # URL → text (BeautifulSoup)
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── JDInput.jsx
    │   │   ├── ModeSelector.jsx
    │   │   ├── InterviewSession.jsx
    │   │   └── Scorecard.jsx
    │   └── App.jsx
```
