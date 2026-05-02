Folder Structure
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