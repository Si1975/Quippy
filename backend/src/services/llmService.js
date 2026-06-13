const axios = require('axios');

// HARD SYSTEM CONSTRAINT: OpenRouter Free Models Whitelist
const ALLOWED_MODELS = [
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-3-27b-it:free',
  'qwen/qwen3-coder:free',
  'mistralai/mistral-7b-instruct:free'
];

function validateModel(model) {
  if (!ALLOWED_MODELS.includes(model)) {
    throw new Error('COST SAFETY VIOLATION: Model ' + model + ' is not in the whitelist. Request aborted.');
  }
}

async function generateQuips(commentBody, apiKey) {
  const model = ALLOWED_MODELS[0];
  validateModel(model);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are a witty, trendy copywriter designing catchphrases for T-shirts and merchandise. Read the following Reddit comment and generate 2-3 short, punchy, funny catchphrases (1-7 words ideally) derived from the comment that would look great printed on a T-shirt. They must be highly topical to the comment. Do not hallucinate new topics. Output each quip on a new line prefixed with a dash (-).'
          },
          {
            role: 'user',
            content: commentBody
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Quippy',
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const quips = content.split('\\n').filter(line => line.trim().startsWith('-')).map(line => line.replace(/^-/, '').trim());
    return quips;
  } catch (error) {
    console.error("LLM request failed:", error.response?.status || error.message);
    if (error.response?.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    throw error;
  }
}

async function suggestSubreddits(category, apiKey) {
  const model = ALLOWED_MODELS[0];
  validateModel(model);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert Reddit researcher. Given a category, suggest 5 to 10 highly relevant subreddits where that topic is actively discussed. Return ONLY a JSON object with a single key "subreddits" containing an array of strings (the subreddit names without the r/ prefix).'
          },
          {
            role: 'user',
            content: `Category: ${category}`
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Quippy',
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanContent);
    if (!data.subreddits || data.subreddits.length === 0) throw new Error('Empty subreddits returned');
    return data.subreddits;
  } catch (error) {
    console.error("LLM suggestSubreddits failed:", error.message);
    const status = error.response?.status || 500;
    const e = new Error('Subreddit ideation failed');
    e.status = status;
    throw e;
  }
}

async function analyzeMarketSignals(aggregatedText, category, apiKey) {
  const model = ALLOWED_MODELS[0];
  validateModel(model);

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are an expert market researcher. Analyze the following Reddit discussions about "${category}". Extract the following 7 market signals:
1. buying_signals: people actively trying to buy.
2. unmet_demand: gaps in the market.
3. style_requests: aesthetics people are asking about.
4. room_specific: bare wall problems or room-specific needs.
5. gift_related: personalised/custom print demand.
6. trend_spotting: what's having a moment.
7. colour_trends: current trending colors.

Return ONLY a JSON object with these exactly 7 keys. Each key should contain a short string summarising the findings with specific examples or quotes if possible.`
          },
          {
            role: 'user',
            content: aggregatedText
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'Quippy',
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error("LLM analyzeMarketSignals failed:", error.message);
    const status = error.response?.status || 500;
    const e = new Error('Market analysis failed');
    e.status = status;
    throw e;
  }
}

module.exports = {
  generateQuips,
  suggestSubreddits,
  analyzeMarketSignals,
  ALLOWED_MODELS
};
