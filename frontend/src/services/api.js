const API_BASE = '/api';

export const ideateSubreddits = async (category) => {
  const res = await fetch(API_BASE + '/ideate-subreddits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ category })
  });
  if (!res.ok) throw new Error('Failed to ideate subreddits');
  return res.json();
};

export const analyzeNiche = async (category, subreddits) => {
  const res = await fetch(API_BASE + '/analyze-niche', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ category, subreddits })
  });
  if (!res.ok) throw new Error('Analysis failed');
  return res.json();
};
