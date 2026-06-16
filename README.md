# MyScheduler — AI Scheduling Assistant

A personal scheduling assistant with AI-powered chat, public booking, and approval workflow.

## Tech Stack
- Frontend: Vanilla HTML/CSS/JS
- Database: Supabase
- Hosting: Vercel
- AI: Gemini 2.0 Flash (via Vercel serverless proxy)

## Project Structure
```
myscheduler/
├── owner.html        # Owner dashboard (password protected)
├── book.html         # Visitor booking page (public)
├── api/
│   └── gemini.js     # Vercel serverless proxy for Gemini API
├── vercel.json       # Vercel routing config
└── README.md
```

## Routes
- `/` or `/owner` → Owner dashboard (requires password)
- `/book` → Visitor booking page (public)

## Config (fill in before deploying)
The following values are embedded in the HTML files:
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_KEY` — Your Supabase anon public key
- `OWNER_PASSWORD` — Dashboard login password
- Gemini API key is only in `api/gemini.js` (server-side, never exposed)

## Database Tables
### schedules
Stores confirmed events on the owner's calendar.

### booking_requests  
Stores visitor booking requests pending owner review.

## Deployment
1. Push this folder to a GitHub repository
2. Import the repository in Vercel
3. Deploy — no build step needed (static HTML)
