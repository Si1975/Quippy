require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./db/schema');
const { fetchHotPosts, fetchComments } = require('./services/redditService');
const { suggestSubreddits, analyzeMarketSignals, ALLOWED_MODELS } = require('./services/llmService');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes

app.get('/api/models', (req, res) => {
  res.json({ models: ALLOWED_MODELS });
});

app.post('/api/ideate-subreddits', async (req, res) => {
  try {
    const { category, model } = req.body;
    const apiKey = req.headers['x-api-key'] || process.env.OPENROUTER_API_KEY;
    if (!category) return res.status(400).json({ error: 'Category is required' });
    if (!apiKey) return res.status(401).json({ error: 'OpenRouter API Key is required' });

    const selectedModel = model || ALLOWED_MODELS[0];
    const subreddits = await suggestSubreddits(category, apiKey, selectedModel);
    res.json({ subreddits });
  } catch (error) {
    console.error("Error in /ideate-subreddits:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.post('/api/analyze-niche', async (req, res) => {
  try {
    const { category, subreddits, model, signalsConfig } = req.body;
    const apiKey = req.headers['x-api-key'] || process.env.OPENROUTER_API_KEY;
    if (!category || !subreddits || !Array.isArray(subreddits)) {
      return res.status(400).json({ error: 'Category and subreddits array are required' });
    }
    if (!apiKey) return res.status(401).json({ error: 'OpenRouter API Key is required' });

    const selectedModel = model || ALLOWED_MODELS[0];

    // Check if we already have a recent analysis for this exact configuration
    const subsJson = JSON.stringify(subreddits.sort());
    const signalsJson = JSON.stringify(signalsConfig || []);
    const existing = db.prepare('SELECT * FROM analyses WHERE category = ? AND subreddits_json = ? AND model_used = ? AND (signals_config_json = ? OR signals_config_json IS NULL) ORDER BY created_at DESC LIMIT 1').get(category, subsJson, selectedModel, signalsJson);
    
    if (existing) {
      return res.json({ 
        signals: JSON.parse(existing.insights_json),
        metadata: {
          id: existing.id,
          category: existing.category,
          subreddits: JSON.parse(existing.subreddits_json),
          model_used: existing.model_used,
          signalsConfig: existing.signals_config_json ? JSON.parse(existing.signals_config_json) : []
        }
      });
    }

    // 1. Fetch Reddit Data
    const allPosts = [];
    for (const sub of subreddits) {
      const posts = await fetchHotPosts(sub);
      allPosts.push(...posts);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit safety
    }

    // Get top 15 posts overall by engagement
    const topPosts = allPosts
      .sort((a, b) => (b.ups + b.num_comments) - (a.ups + a.num_comments))
      .slice(0, 15);

    let aggregatedText = '';
    
    // Fetch comments for top posts and aggregate text
    for (const post of topPosts) {
      aggregatedText += `\nTitle: ${post.title}\nPost Body: ${post.selftext || ''}\n`;
      const comments = await fetchComments(post.id);
      for (const comment of comments.slice(0, 5)) { // Top 5 comments per post
        if (comment.body) {
          aggregatedText += `Comment: ${comment.body}\n`;
        }
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    if (aggregatedText.trim() === '') {
       return res.status(404).json({ error: 'No meaningful discussion data found for these subreddits.' });
    }

    // 2. Send to LLM
    const signals = await analyzeMarketSignals(aggregatedText, category, apiKey, selectedModel, signalsConfig);

    // 3. Cache the result
    const info = db.prepare('INSERT INTO analyses (category, subreddits_json, insights_json, model_used, signals_config_json, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      category,
      subsJson,
      JSON.stringify(signals),
      selectedModel,
      signalsJson,
      Date.now()
    );

    res.json({ 
      signals,
      metadata: {
        id: info.lastInsertRowid,
        category,
        subreddits,
        model_used: selectedModel,
        signalsConfig: signalsConfig || []
      }
    });
  } catch (error) {
    console.error("Error in /analyze-niche:", error);
    res.status(error.status || 500).json({ error: error.message });
  }
});

app.get('/api/history', (req, res) => {
  try {
    const history = db.prepare('SELECT id, category, subreddits_json, model_used, created_at FROM analyses ORDER BY created_at DESC').all();
    res.json(history.map(row => ({
      ...row,
      subreddits: JSON.parse(row.subreddits_json)
    })));
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.get('/api/history/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM analyses WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Analysis not found' });
    res.json({ 
      signals: JSON.parse(row.insights_json),
      metadata: {
        id: row.id,
        category: row.category,
        model_used: row.model_used,
        subreddits: JSON.parse(row.subreddits_json),
        signalsConfig: row.signals_config_json ? JSON.parse(row.signals_config_json) : []
      }
    });
  } catch (error) {
    console.error("Error fetching analysis:", error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Quippy Market Research Backend running on port ' + PORT);
});
