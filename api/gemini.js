export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.body?.type === 'email') {
    return res.status(200).json({ success: true });
  }

  const { messages = [], systemPrompt = '' } = req.body || {};
  if (!messages.length) return res.status(400).json({ error: 'No messages' });

  // Use Claude API (built into this Vercel environment via Anthropic)
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: systemPrompt || 'You are a helpful scheduling assistant.',
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || '')
        }))
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.content?.[0]?.text;
      if (text) return res.status(200).json({ response: text });
    }

    const errText = await response.text();
    console.error('Claude API error:', response.status, errText);
  } catch(e) {
    console.error('Fetch error:', e.message);
  }

  // Gemini fallback
  const GEMINI_KEY = 'AQ.Ab8RN6JRbDf0MTqiMdH6Q1jLWogSif-4HT6ANLDSWzchzZqB_g';
  const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash'];

  const contents = [];
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: 'Instructions: ' + systemPrompt }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood.' }] });
  }
  messages.forEach(m => contents.push({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents, generationConfig: { maxOutputTokens: 800 } }) }
      );
      const d = await r.json();
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.status(200).json({ response: text });
    } catch(e) { continue; }
  }

  return res.status(500).json({ error: 'AI unavailable' });
}
