# SIP & Investment Calculator

A small full‑stack web app that estimates how a **monthly SIP** or a **one‑time (lump‑sum) investment** grows over time. Enter the amount, expected annual return, and time period, and it shows the total invested, estimated returns, and future value, plus a growth chart and a year‑by‑year breakdown. Supports SIP and lump‑sum modes and light/dark themes.

Built with the help of AI coding tools (Claude Code) and reviewed/tested by hand.

## Tech stack

- **Backend:** Python, FastAPI, Pydantic (REST API that performs the projection math), tested with pytest.
- **Frontend:** React 18 (functional components + hooks), Vite, plain CSS, and a hand‑drawn SVG growth chart (no chart library).
- The React app calls the backend at `POST /api/projection`; it also has a client‑side fallback so the UI still works on static hosting or offline.

## Project structure

```
SIP_calculator/
├── backend/
│   ├── main.py            # FastAPI app + finance math
│   ├── test_main.py       # pytest tests
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js     # proxies /api -> http://localhost:8000
    ├── package.json
    └── src/ (main.jsx, App.jsx, api.js, styles.css)
```

## Run it locally

**1. Backend** (http://localhost:8000):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

**2. Frontend** (http://localhost:5173):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — the dev server proxies `/api` to the backend.

## Tests

```bash
cd backend && source .venv/bin/activate && pytest -q
```

## The math

- **SIP** (contributions at the start of each month): `FV = P × (((1+i)^n − 1) / i) × (1+i)`, where `i` = monthly rate, `n` = months.
- **Lump sum:** `FV = P × (1+r)^t`.

> For illustration only; assumes a constant annual return. Actual market returns vary.
