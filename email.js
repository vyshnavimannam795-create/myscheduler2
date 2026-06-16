export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { to, subject, html } = req.body;
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const OWNER_EMAIL = process.env.OWNER_EMAIL;

    if (!RESEND_API_KEY) return res.status(500).json({ error: 'Email not configured' });

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'MyScheduler <onboarding@resend.dev>', to: [to], subject, html })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.message || 'Email error' });

    return res.status(200).json({ success: true, id: data.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
