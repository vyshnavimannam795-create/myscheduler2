export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Email requests - just log
  if (req.body?.type === 'email') {
    return res.status(200).json({ success: true });
  }

  const { messages = [], systemPrompt = '' } = req.body || {};
  if (!messages.length) return res.status(400).json({ error: 'No messages' });

  const GEMINI_KEY = 'AQ.Ab8RN6JRbDf0MTqiMdH6Q1jLWogSif-4HT6ANLDSWzchzZqB_g';

  // Build contents with system prompt as first exchange
  const contents = [];
  if (systemPrompt) {
    contents.push({
      role: 'user',
      parts: [{ text: 'System Instructions:\n' + systemPrompt }]
    });
    contents.push({
      role: 'model', 
      parts: [{ text: 'Understood. I will follow these instructions.' }]
    });
  }

  // Add conversation messages
  for (const m of messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }]
    });
  }

  // Try models in order
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
          })
        }
      );

      const data = await response.json();

      // Skip if quota/error
      if (data.error) {
        console.log(`${model} error:`, data.error.code, data.error.message);
        if (data.error.code === 429 || data.error.status === 'RESOURCE_EXHAUSTED') continue;
        if (data.error.code === 403) continue;
        continue;
      }

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return res.status(200).json({ response: text, model });
      }
    } catch (e) {
      console.log(`${model} exception:`, e.message);
      continue;
    }
  }

  // All failed - return helpful message instead of error
  const lastMsg = String(messages[messages.length - 1]?.content || '').toLowerCase();
  let smart = '';
  if (lastMsg.includes('today') || lastMsg.includes('schedule')) {
    smart = 'Check Panel 2 for today\'s schedule. Select today\'s date on the calendar to see all slots.';
  } else if (lastMsg.includes('free') || lastMsg.includes('available')) {
    smart = 'Select a date on the calendar — green slots are available, grey slots are booked.';
  } else if (lastMsg.includes('pending') || lastMsg.includes('request')) {
    smart = 'Click the "Requests" tab in the header to see all pending booking requests.';
  } else if (lastMsg.includes('cancel')) {
    smart = 'Find the slot in Panel 2 and click the "✕ Cancel" button to cancel it.';
  } else if (lastMsg.includes('book') || lastMsg.includes('meeting')) {
    smart = 'Click "+ Add Slot" button in the header to book a new meeting slot.';
  } else {
    smart = 'AI quota exceeded. Use the dashboard directly — calendar on left, schedule in middle, requests tab in header.';
  }

  return res.status(200).json({ response: smart, model: 'smart-fallback' });
}
