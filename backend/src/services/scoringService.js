/**
 * Memeability SCORING
 * Each comment gets a MemeScore based on:
 * - Upvotes (primary signal)
 * - Reply count
 * - Brevity (shorter is often punchier)
 */

function calculateMemeScore(upvotes, replyCount, body) {
  // Normalize lengths
  const length = body ? body.length : 0;
  
  // Base score is upvotes
  let score = upvotes || 0;
  
  // Bonus for generating discussion (replies)
  score += (replyCount || 0) * 5;
  
  // Brevity multiplier: 
  // Very short (under 50 chars) -> 1.5x
  // Medium (50 - 200 chars) -> 1.2x
  // Long (over 200 chars) -> 0.8x
  if (length < 50) {
    score *= 1.5;
  } else if (length < 200) {
    score *= 1.2;
  } else {
    score *= 0.8;
  }
  
  return score;
}

module.exports = {
  calculateMemeScore
};
