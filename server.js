// Sarkari Saathi AI — backend server
// Yeh server frontend ko serve karta hai AUR Gemini API ko securely call karta hai.
// API key hamesha server par (environment variable) rehti hai, browser mein kabhi nahi jaati.

const express = require('express');
const path = require('path');
const fs = require('fs');
const rateLimit = require('./rate-limit');

const app = express();
app.use(express.json({ limit: '20kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Schemes data load karo — AI ko context dene ke liye
let schemesContext = '';
try {
  const schemes = JSON.parse(fs.readFileSync(path.join(__dirname, 'public', 'data', 'schemes.json'), 'utf8'));
  schemesContext = schemes.map(s => `${s.name} (${s.category}): ${s.desc}`).join('\n');
} catch (e) {
  console.warn('schemes.json load nahi ho payi, AI bina context ke chalega.', e.message);
}

const SYSTEM_PROMPT = `Tum "Sarkari Saathi AI" ho — Bharat ki sarkari yojanaon, scholarships, jobs aur documents ke baare mein saral Hindi/Hinglish mein madad karne wale AI assistant. Hamesha clear aur poora jawab do (zaroorat ho to 150-200 words tak), aur jahan relevant ho official website ka naam batao. Jawab hamesha poora khatam karo, kabhi beech mein mat chhodo. Bold text ke liye ** ka use mat karo, plain simple text mein likho. Agar exact jaankari na ho, to user ko official portal par verify karne ko kaho. Kabhi bhi kisi scheme ke baare mein galat guarantee mat do. Sirf sarkari yojanaon/services se related sawalon ke jawab do; agar sawaal bilkul unrelated ho, to politely bata do ki tum sirf sarkari jaankari mein madad kar sakte ho.

Hamare database mein ye schemes hain (reference ke liye):
${schemesContext}`;

// Simple in-memory rate limiter: har IP se max 20 requests/10 minute
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 20 });

app.post('/api/chat', limiter, async (req, res) => {
  try {
    const message = (req.body && req.body.message ? String(req.body.message) : '').trim();
    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }
    if (message.length > 1000) {
      return res.status(400).json({ error: 'message too long' });
    }
    if (!GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI abhi configure nahi hai (GEMINI_API_KEY set nahi hai).' });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
           generationConfig: { maxOutputTokens: 2048, temperature: 0.4, thinkingConfig: { thinkingBudget: 0 } }
      })
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      console.error('Gemini API error', r.status, errText.slice(0, 500));
      return res.status(502).json({ error: 'AI service abhi jawab nahi de paaya.' });
    }

    const data = await r.json();
    const text = (data && data.candidates && data.candidates[0] && data.candidates[0].content &&
      data.candidates[0].content.parts || []).map(p => p.text).join('').trim();

    if (!text) {
      return res.status(502).json({ error: 'AI se khaali jawab mila.' });
    }
    res.json({ reply: text });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Server mein kuch gadbad ho gayi.' });
  }
});

// Health check — deploy hone ke baad browser mein /health khol kar check kar sakte ho
app.get('/health', (req, res) => {
  res.json({ ok: true, aiConfigured: !!GEMINI_API_KEY });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sarkari Saathi AI server chal raha hai: http://localhost:${PORT}`);
  console.log(`AI configured: ${GEMINI_API_KEY ? 'HAAN' : 'NAHI — GEMINI_API_KEY environment variable set karo'}`);
});
