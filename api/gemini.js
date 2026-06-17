export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (req.body?.type === 'email') {
    console.log('Email:', req.body.to, req.body.subject);
    return res.status(200).json({ success: true });
  }

  const { messages = [], systemPrompt = '' } = req.body || {};
  if (!messages.length) return res.status(400).json({ error: 'No messages' });

  const GEMINI_KEY = 'AQ.Ab8RN6JRbDf0MTqiMdH6Q1jLWogSif-4HT6ANLDSWzchzZqB_g';
  const MODELS = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];

  // Build contents — prepend system prompt as first exchange
  const contents = [];
  if (systemPrompt) {
    contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nAcknowledge briefly.' }] });
    contents.push({ role: 'model', parts: [{ text: 'Understood. Ready to help.' }] });
  }
  messages.forEach(m => contents.push({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '') }]
  }));

  for (const model of MODELS) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 800, temperature: 0.7 }
          })
        }
      );
      const d = await r.json();
      if (d.error) { console.log(`${model}:`, d.error.message); continue; }
      const text = d.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return res.status(200).json({ response: text, model });
    } catch(e) { console.log(`${model} fail:`, e.message); }
  }

  return res.status(500).json({ error: 'All Gemini models failed. Check API quota at aistudio.google.com' });
}
