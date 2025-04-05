const axios = require('axios');
const router = require('express').Router();

router.post('/ask', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a helpful tutor" },
          { role: "user", content: req.body.question }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error('DeepSeek Error:', error.response?.data || error.message);
    res.status(500).json({ error: "AI service unavailable" });
  }
});

module.exports = router;