const API_BASE = '/api';

export const ideateSubreddits = async (category, apiKey) => {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;
  
  const res = await fetch(API_BASE + '/ideate-subreddits', {
    method: 'POST',
    headers,
    body: JSON.stringify({ category })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('API_KEY_REQUIRED');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error('Failed to ideate subreddits');
  }
  return res.json();
};

export const analyzeNiche = async (category, subreddits, apiKey) => {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers['X-API-Key'] = apiKey;

  const res = await fetch(API_BASE + '/analyze-niche', {
    method: 'POST',
    headers,
    body: JSON.stringify({ category, subreddits })
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('API_KEY_REQUIRED');
    if (res.status === 429) throw new Error('RATE_LIMIT');
    throw new Error('Analysis failed');
  }
  return res.json();
};

export const fetchHistory = async () => {
  const res = await fetch(API_BASE + '/history');
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
};

export const fetchAnalysis = async (id) => {
  const res = await fetch(API_BASE + `/history/${id}`);
  if (!res.ok) throw new Error('Failed to fetch analysis');
  return res.json();
};
