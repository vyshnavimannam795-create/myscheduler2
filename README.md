# MyScheduler

A personal AI scheduling assistant with public booking and approval workflow.

## Setup

### Environment Variables (Vercel)
Add these in Vercel Dashboard → Settings → Environment Variables:

```
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key (optional, for emails)
OWNER_EMAIL=your_email@example.com
```

### Deploy
1. Upload all files to GitHub repository
2. Connect to Vercel and deploy
3. Set environment variables
4. Done!

## URLs
- `/` → Redirects to `/book`
- `/owner` → Owner dashboard (password protected)
- `/book` → Visitor booking page

## Tech Stack
- **Frontend**: Vanilla HTML/CSS/JS
- **Database**: Supabase (PostgreSQL)
- **AI**: Gemini 2.0 Flash via Vercel serverless proxy
- **Hosting**: Vercel
- **Email**: Resend API (optional)
