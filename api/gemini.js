export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_KEY = 'AQ.Ab8RN6Kiuy6GVCDazatOVCTxUxBUGRa-x-wvjJv-VZyobovpCA';

  try {
    const body = req.body;

    // Email requests — just log for now
    if (body.type === 'email') {
      console.log('Email to:', body.to, '| Subject:', body.subject);
      return res.status(200).json({ success: true });
    }

    const { messages = [], systemPrompt = '' } = body;
    if (!messages.length) {
      return res.status(400).json({ error: 'No messages provided' });
    }

    // Build contents array
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    }));

    // If systemPrompt exists, prepend it as first user message
    // (safer than system_instruction for free tier)
    if (systemPrompt) {
      contents.unshift({
        role: 'user',
        parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${systemPrompt}\n[END INSTRUCTIONS]\n\nPlease acknowledge these instructions briefly.` }]
      });
      contents.splice(1, 0, {
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }

    // Try gemini-1.5-flash first (more reliable on free tier)
    const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    
    let lastError = '';
    for (const model of models) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7
              }
            })
          }
        );

        const data = await response.json();
        
        if (data.error) {
          lastError = `${model}: ${data.error.message}`;
          console.error('Model error:', lastError);
          continue; // try next model
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          lastError = `${model}: empty response`;
          continue;
        }

        return res.status(200).json({ response: text, model });
      } catch (modelErr) {
        lastError = `${model}: ${modelErr.message}`;
        continue;
      }
    }

    // All models failed
    return res.status(500).json({ 
      error: `All models failed. Last error: ${lastError}`,
      hint: 'Check if Gemini API key is valid at aistudio.google.com'
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
