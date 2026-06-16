export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = 'AQ.Ab8RN6Kcax_xfjDDlKfz6-IJ0JrUQDm9yP4HNH0V8eLjkHiZuw';

  try {
    const { messages, systemPrompt } = req.body;

    // Handle email sending requests
    if (req.body.type === 'email') {
      // Email via Resend API (free tier)
      const { to, subject, html } = req.body;
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer re_placeholder_key'
          },
          body: JSON.stringify({
            from: 'MyScheduler <onboarding@resend.dev>',
            to: [to],
            subject,
            html
          })
        });
        const emailData = await emailRes.json();
        return res.status(200).json({ success: true, emailData });
      } catch(e) {
        // Email failed silently — app still works
        return res.status(200).json({ success: false, error: 'Email failed' });
      }
    }

    // Handle Gemini AI requests
    const geminiMessages = (messages || []).map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const body = {
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
    };
    if (systemPrompt) {
      body.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    );

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
    return res.status(200).json({ response: text });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
