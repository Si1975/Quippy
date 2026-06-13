# Quippy: Market Research Dashboard

Quippy is an AI-powered market research dashboard that scrapes Reddit discussions to identify emerging trends, unmet demand, and buying signals for any given niche.

## 🚀 What It Does

1. **Category Ideation**: Enter a broad category (like "Wall Art" or "Mechanical Keyboards") and the app's LLM suggests the most relevant subreddits to analyze.
2. **Data Aggregation**: The backend connects to Reddit and scrapes the hottest posts and top comments from those targeted subreddits.
3. **Signal Extraction**: The scraped text is sent to an LLM, which is specifically prompted to extract 7 key market signals:
   - Buying Signals
   - Unmet Demand
   - Style Requests
   - Room Specific Problems
   - Gift & Custom Demand
   - Trend Spotting
   - Colour Trends
4. **Premium UI**: Results are displayed in a sleek, glassmorphic grid dashboard built with React.

## 🛠️ How to Run Locally

### Prerequisites
- Node.js installed on your machine.
- An API key from [OpenRouter](https://openrouter.ai/).

### Setup
1. **Configure Environment Variables**
   Navigate to the `backend` folder and create a `.env` file (if it doesn't exist already):
   ```env
   OPENROUTER_API_KEY=your_api_key_here
   ```

2. **Install Dependencies**
   Run the following command in the root of the project to install all required packages:
   ```bash
   npm install
   ```

3. **Start the Development Server**
   Start both the frontend and backend simultaneously:
   ```bash
   npm run dev
   ```
   The app will automatically open in your browser at `http://localhost:5173`.

---

## 🤖 Notes for Claude (or other AI Assistants)

Hello fellow AI! If you are helping the user build upon this project, here is a technical brief to get you up to speed quickly:

### 1. Architecture & Tech Stack
- **Frontend**: React (Vite). The UI is highly styled using custom CSS (`frontend/src/index.css`) focused on a premium, glassmorphic aesthetic.
- **Backend**: Node.js + Express.
- **Database**: `better-sqlite3`. The schema is defined in `backend/src/db/schema.js`.
- **LLM Integration**: The app uses OpenRouter (specifically `meta-llama/llama-3.3-70b-instruct:free`).

### 2. Core Workflows to Understand
- **`suggestSubreddits`**: Found in `backend/src/services/llmService.js`. Takes a category string and returns a JSON array of subreddit names.
- **`analyzeMarketSignals`**: Found in `backend/src/services/llmService.js`. Takes aggregated Reddit text and returns a JSON object mapped to the 7 market signals. 
  - *Important Context*: Free LLM models can be flaky with strict JSON structures. The code currently uses regex (`replace(/```json/g, '')`) to strip markdown blocks before parsing `JSON.parse()`.
- **Caching**: To save API credits and bypass rate limits, analyses are cached in the SQLite `analyses` table based on the `category` and `subreddits_json`.

### 3. Known Limitations & Edge Cases (Important!)
- **Reddit 403 Errors**: `backend/src/services/redditService.js` scrapes Reddit's public `.json` endpoints (e.g., `https://www.reddit.com/r/subreddit/hot.json`) without OAuth. Reddit frequently blocks IPs or User-Agents with a `403 Forbidden` error. 
  - *Current Workaround*: If the Reddit fetch fails or returns empty data, the backend injects a mock/fallback string into the LLM pipeline so the app doesn't crash during demos. Be careful when modifying the scraping logic.
- **OpenRouter Rate Limits**: The free tier of OpenRouter has strict RPM limits. Fallbacks are hardcoded in `llmService.js` `catch` blocks to ensure the frontend still renders successfully even if the API 429s.

### 4. Expansion Ideas
If the user wants to expand this, good areas to tackle would be:
- Adding proper Reddit OAuth to `redditService.js` to prevent 403 errors.
- Allowing the user to export the analysis to a PDF or CSV.
- Adding historical tracking so users can see how trends change week over week.
