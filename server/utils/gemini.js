// Shared Gemini API helper for the AI Assistant feature (student AI Tutor +
// instructor AI Lesson Assistant). Uses plain fetch against the REST API
// rather than pulling in an SDK — Node 22's built-in fetch is enough for
// this one call, and it keeps the free-tier integration to a single file.

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPTS = {
  student:
    "You are KayTech Hub's AI Tutor, helping students understand course concepts across web development, AI, data analysis, cybersecurity, design, and other subjects we teach. Be clear, encouraging, and focused on helping them learn — not overly long.",
  instructor:
    "You are KayTech Hub's AI Lesson Assistant, helping instructors draft lesson notes, outlines, explanations, and exercise ideas for the courses they teach. Be practical and structured — instructors will edit/use this content directly in their lessons, so favor clear headings, organized points, and ready-to-use structure over conversational filler.",
};

// A ChatMessage.role of 'assistant' maps to Gemini's 'model' role.
const toGeminiRole = (role) => (role === 'assistant' ? 'model' : 'user');

// `history` is an array of { role: 'user'|'assistant', content } ordered
// oldest-first, NOT including the new message. `message` is the new user
// turn. Throws an Error with a `.status` of 429 on rate limit so callers
// can show a friendly "busy" message instead of a generic failure.
async function askGemini({ context, history, message }) {
  const systemPrompt = SYSTEM_PROMPTS[context];
  if (!systemPrompt) {
    throw new Error(`Unknown assistant context: ${context}`);
  }

  const contents = [
    ...history.map((m) => ({ role: toGeminiRole(m.role), parts: [{ text: m.content }] })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const response = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    const err = new Error(`Gemini API error (${response.status}): ${errBody}`);
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';

  if (!reply) {
    throw new Error('Gemini API returned an empty response');
  }

  return reply;
}

module.exports = { askGemini, SYSTEM_PROMPTS };
