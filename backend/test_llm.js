require('dotenv').config();
const { generateQuips, ALLOWED_MODELS } = require('./src/services/llmService');
(async () => {
  console.log("Model:", ALLOWED_MODELS[1]);
  console.log("Key:", process.env.OPENROUTER_API_KEY.slice(0, 10) + "...");
  const quips = await generateQuips("I absolutely love T-shirts with funny programming jokes.", process.env.OPENROUTER_API_KEY);
  console.log("Result:", quips);
})();
