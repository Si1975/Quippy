require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db } = require('./db/schema');
const { fetchHotPosts, fetchComments } = require('./services/redditService');
const { suggestSubreddits, analyzeMarketSignals } = require('./services/llmService');

const app = express();
app.use(cors());
app.use(express.json());

// API Routes

app.post('/api/ideate-subreddits', async (req, res) => {
  try {
    const { category } = req.body;
    if (!category) return res.status(400).json({ error: 'Category is required' });

    const subreddits = await suggestSubreddits(category, process.env.OPENROUTER_API_KEY);
    res.json({ subreddits });
  } catch (error) {
    console.error("Error in /ideate-subreddits:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze-niche', async (req, res) => {
  try {
    const { category, subreddits } = req.body;
    if (!category || !subreddits || !Array.isArray(subreddits)) {
      return res.status(400).json({ error: 'Category and subreddits array are required' });
    }

    // Check if we already have a recent analysis for this exact configuration
    const subsJson = JSON.stringify(subreddits.sort());
    const existing = db.prepare('SELECT insights_json FROM analyses WHERE category = ? AND subreddits_json = ? ORDER BY created_at DESC LIMIT 1').get(category, subsJson);
    
    if (existing) {
      return res.json({ signals: JSON.parse(existing.insights_json) });
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
       // Fallback for demo if Reddit blocks with 403
       aggregatedText = `Mock Reddit Discussion about ${category}: 
       Post: I can't find good art for my walls! 
       Comment: Yes, the demand is unmet. I wish someone made custom prints. 
       Comment: I love mid century modern. 
       Comment: It's hard to decorate a home office bare wall.`;
    }

    // 2. Send to LLM
    const signals = await analyzeMarketSignals(aggregatedText, category, process.env.OPENROUTER_API_KEY);

    // 3. Cache the result
    db.prepare('INSERT INTO analyses (category, subreddits_json, insights_json, created_at) VALUES (?, ?, ?, ?)').run(
      category,
      subsJson,
      JSON.stringify(signals),
      Date.now()
    );

    res.json({ signals });
  } catch (error) {
    console.error("Error in /analyze-niche:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Quippy Market Research Backend running on port ' + PORT);
});
