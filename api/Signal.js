export default async function handler(req, res) {
  // CORS Headers allow karne ke liye
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { content, mode, tone } = req.body;
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Groq API Key missing" });
    }

    let prompt = "";
    if (mode === 'extract') {
      prompt = "You are Signa AI. Extract ONLY raw factual signals/points. Absolutely no fluff, intros, or summaries. Format as a clean list with individual points separated by newlines.";
    } else if (mode === 'refine') {
      prompt = `You are Signa AI. Rewrite the user's raw input strictly in a highly direct, clear, and impactful ${tone || 'Founder'} tone. Max 2 sentences.`;
    } else if (mode === 'score') {
      prompt = 'You are Signa AI. Rate the input text out of 100 based on true signal data. Return ONLY a valid JSON format like: {"score": 82, "clarity": 84, "actionability": 79, "originality": 81, "verdict": "High Signal", "desc": "This content is valuable and to the point."}';
    }

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: content }
        ],
        temperature: 0.2
      })
    });

    const data = await groqResponse.json();
    const result = data.choices[0].message.content.trim();

    const payload = mode === 'score' ? JSON.parse(result) : { result };
    return res.status(200).json(payload);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
