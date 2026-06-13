# Quippy: Market Research Dashboard

Quippy is an AI-powered market research dashboard that scrapes Reddit discussions to identify emerging trends, unmet demand, and buying signals for any given niche.

## 🚀 What It Does

1. **Category Ideation**: Enter a broad category (like "Wall Art" or "Mechanical Keyboards") and the app's LLM suggests the most relevant subreddits to analyze.
2. **Data Aggregation**: The backend connects to the PullPush API to scrape the hottest posts and top comments from those targeted subreddits.
3. **Custom Signal Extraction**: The scraped text is sent to an LLM, which is dynamically prompted to extract specific market signals. You can toggle default signals on/off or create your own custom signals on the fly.
4. **Historical Tracking**: All analyses are saved to a local SQLite database, allowing you to seamlessly load past research and track market changes over time.
5. **Premium UI**: Results are displayed in a sleek, glassmorphic grid dashboard built with React, featuring dynamic view toggles and integrated internal scrolling.

## 🎯 How Custom Signals Work

Quippy allows you to define exactly what kind of market research the AI should look for in the Reddit data. By adding a Custom Signal in the Configuration Panel, you dynamically alter the system prompt sent to the LLM.

When adding a custom signal, you need to provide three fields:
- **Key**: A simple internal identifier (e.g., `brand_mentions` or `pricing_complaints`). Use lowercase and underscores.
- **Label**: The human-readable title that will appear in your insights dashboard (e.g., "Brand Mentions").
- **Description**: This is the most important part! **This description is injected directly into the LLM prompt.** It tells the AI exactly what to search for in the text. For example, if you enter *"people complaining about high prices or asking for budget alternatives"*, the AI will scan all the scraped Reddit posts specifically for quotes matching that behavior.

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
   *Note: If you don't set this up, the UI will prompt you to enter a key and save it securely in your browser's local storage.*

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
- **Database**: `better-sqlite3`. The schema is defined in `backend/src/db/schema.js`. *Note: The database (`.db` / `.sqlite`) and `.env` files are ignored in `.gitignore`.*
- **LLM Integration**: The app uses OpenRouter. The backend fetches active free models dynamically (e.g., `google/gemma-4-31b-it:free`) and allows the user to switch models via the frontend Configuration Panel.

### 2. Core Workflows to Understand
- **`suggestSubreddits`**: Found in `backend/src/services/llmService.js`. Takes a category string and returns a JSON array of subreddit names.
- **`analyzeMarketSignals`**: Found in `backend/src/services/llmService.js`. Takes aggregated text and returns a JSON object mapped to the 7 market signals. 
  - *Important Context*: Free LLM models can be flaky with strict JSON structures. The code currently uses regex (`replace(/```json/g, '')`) to strip markdown blocks before parsing `JSON.parse()`.
- **Caching & History**: To save API credits, analyses are cached in the SQLite `analyses` table based on the `category`, `subreddits_json`, and `model_used`.

### 3. Known Limitations & Edge Cases (Important Workarounds!)
- **Reddit 403 Errors**: Reddit's "Responsible Builder Policy" (enacted Nov 2025) aggressively blocks anonymous scraping via their public `.json` endpoints and restricts new Developer API keys. 
  - **The Workaround**: `backend/src/services/redditService.js` was rewritten to use **PullPush.io** (`https://api.pullpush.io`), a community project that indexes Reddit. This completely bypasses the Reddit API, requiring no auth tokens and avoiding 403 errors. However, note that PullPush indexing can occasionally lag behind live Reddit by a few hours.
- **OpenRouter Rate Limits**: The free tier of OpenRouter has strict RPM limits. If a 200 response contains `response.data.error`, the `api.js` layer correctly maps this to a `RATE_LIMIT` error and the frontend surfaces a clean UI warning.
