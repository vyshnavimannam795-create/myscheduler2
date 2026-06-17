export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = 'AQ.Ab8RN6Kcax_xfjDDlKfz6-IJ0JrUQDm9yP4HNH0V8eLjkHiZuw';

  try {
    const body = req.body;

    // Email requests
    if (body.type === 'email') {
      // Log email (Resend integration - add key later)
      console.log('Email request:', body.to, body.subject);
      return res.status(200).json({ success: true, note: 'Email logged' });
    }

    // AI chat
    const { messages = [], systemPrompt = '' } = body;
    if (!messages.length) return res.status(400).json({ error: 'No messages provided' });

    const geminiMessages = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    const requestBody = {
      contents: geminiMessages,
      generationConfig: { maxOutputTokens: 1024, temperature: 0.7 }
    };
    if (systemPrompt) {
      requestBody.system_instruction = { parts: [{ text: systemPrompt }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini error:', response.status, errText);
      return res.status(500).json({ error: `Gemini API error: ${response.status}` });
    }

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' });

    return res.status(200).json({ response: text });
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
