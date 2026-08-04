const ChatMessage = require('../models/ChatMessage');
const { askGemini } = require('../utils/gemini');

// How many prior turns to send back to Gemini as conversation context.
// Keeps free-tier token usage bounded rather than sending the full history.
const HISTORY_WINDOW = 20;

// route is restricted to student/instructor (see assistantRoutes.js), so
// the context is always one of these two — never trusted from the client,
// always derived from the authenticated user's role.
const contextForUser = (user) => (user.role === 'student' ? 'student' : 'instructor');

// GET /api/assistant/history — the caller's own AI Tutor / AI Lesson
// Assistant chat history, scoped to their role's context only.
const getHistory = async (req, res) => {
  try {
    const context = contextForUser(req.user);
    const messages = await ChatMessage.find({ user_id: req.user._id, context }).sort({ created_at: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ message: 'Failed to load chat history', error: err.message });
  }
};

// POST /api/assistant/chat — send a message, get the AI's reply back.
// Persists both the user's message and the assistant's reply (so history
// stays intact even if a later request fails).
const sendMessage = async (req, res) => {
  try {
    const content = (req.body.message || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }
    if (content.length > 4000) {
      return res.status(400).json({ message: 'Message is too long (max 4000 characters)' });
    }

    const context = contextForUser(req.user);

    const recentHistory = await ChatMessage.find({ user_id: req.user._id, context })
      .sort({ created_at: -1 })
      .limit(HISTORY_WINDOW);
    recentHistory.reverse();

    const userMessage = await ChatMessage.create({
      user_id: req.user._id,
      context,
      role: 'user',
      content,
    });

    try {
      const reply = await askGemini({
        context,
        history: recentHistory.map((m) => ({ role: m.role, content: m.content })),
        message: content,
      });

      const assistantMessage = await ChatMessage.create({
        user_id: req.user._id,
        context,
        role: 'assistant',
        content: reply,
      });

      res.status(201).json({ userMessage, assistantMessage });
    } catch (aiErr) {
      if (aiErr.status === 429) {
        return res.status(429).json({
          message: 'The AI assistant is a bit busy right now — please try again in a moment.',
          userMessage,
        });
      }
      console.error(aiErr);
      res.status(502).json({
        message: 'The AI assistant could not respond right now. Please try again shortly.',
        userMessage,
      });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to send message', error: err.message });
  }
};

module.exports = { getHistory, sendMessage };
