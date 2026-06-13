const axios = require('axios');
const { calculateMemeScore } = require('./scoringService');
const { db } = require('../db/schema');

const USER_AGENT = 'Quippy/1.0.0 (by u/QuippyApp)';

/**
 * Fetch hot posts from a given subreddit
 */
async function fetchHotPosts(subreddit) {
  try {
    const url = 'https://api.pullpush.io/reddit/search/submission/?subreddit=' + subreddit + '&size=25';
    const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch from r/' + subreddit + ':', error.message);
    return [];
  }
}

/**
 * Fetch comments for a specific post
 */
async function fetchComments(postId) {
  try {
    const url = 'https://api.pullpush.io/reddit/search/comment/?link_id=' + postId + '&size=20';
    const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
    const commentsData = response.data.data || [];
    return commentsData.filter(c => c.body);
  } catch (error) {
    console.error('Failed to fetch comments for ' + postId + ':', error.message);
    return [];
  }
}

/**
 * Ingest posts and comments into SQLite
 */
async function ingestRedditData(subreddits) {
  const allPosts = [];
  
  // 1. Fetch posts
  for (const sub of ['all', ...subreddits]) {
    const posts = await fetchHotPosts(sub);
    allPosts.push(...posts);
    // Be nice to API rate limits (1 request per sec roughly)
    await new Promise(r => setTimeout(r, 1000));
  }

  // 2. Deduplicate
  const uniquePostsMap = new Map();
  for (const post of allPosts) {
    if (!uniquePostsMap.has(post.id) && post.title && !post.over_18) {
      uniquePostsMap.set(post.id, {
        id: post.id,
        title: post.title,
        subreddit: post.subreddit,
        upvotes: post.score || post.ups || 0,
        num_comments: post.num_comments || 0,
        created_utc: post.created_utc,
        fetched_at: Date.now()
      });
    }
  }

  const uniquePosts = Array.from(uniquePostsMap.values());

  // 3. Insert Posts
  const insertPost = db.prepare(
    'INSERT OR IGNORE INTO posts (id, title, subreddit, upvotes, num_comments, created_utc, fetched_at) ' +
    'VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  
  const updatePost = db.prepare(
    'UPDATE posts SET upvotes = ?, num_comments = ? WHERE id = ?'
  );

  const insertComment = db.prepare(
    'INSERT OR REPLACE INTO comments (id, post_id, body, upvotes, replies_count, meme_score) ' +
    'VALUES (?, ?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    for (const post of uniquePosts) {
      const info = insertPost.run(post.id, post.title, post.subreddit, post.upvotes, post.num_comments, post.created_utc, post.fetched_at);
      if (info.changes === 0) {
         updatePost.run(post.upvotes, post.num_comments, post.id);
      }
    }
  })();

  // 4. Fetch Comments for Top 10 Posts by Engagement (Upvotes + Comments)
  const topPosts = uniquePosts
    .sort((a, b) => (b.upvotes + b.num_comments) - (a.upvotes + a.num_comments))
    .slice(0, 10);

  for (const post of topPosts) {
    const comments = await fetchComments(post.id);
    
    db.transaction(() => {
      for (const comment of comments) {
        if (!comment.id || !comment.body) continue;
        const repliesCount = 0; // Pullpush doesn't nest replies easily
        const ups = comment.score || comment.ups || 0;
        const memeScore = calculateMemeScore(ups, repliesCount, comment.body);
        insertComment.run(comment.id, post.id, comment.body, ups, repliesCount, memeScore);
      }
    })();
    await new Promise(r => setTimeout(r, 1000));
  }
}

module.exports = {
  ingestRedditData,
  fetchComments,
  fetchHotPosts
};
