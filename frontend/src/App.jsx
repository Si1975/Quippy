import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Key, History } from 'lucide-react';
import ConfigurationPanel from './components/ConfigurationPanel';
import InsightsDashboard from './components/InsightsDashboard';
import { analyzeNiche, fetchHistory, fetchAnalysis } from './services/api';

function App() {
  const [signals, setSignals] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null); // { type, message }
  const [apiKey, setApiKey] = useState(localStorage.getItem('openrouter_key') || '');
  const [history, setHistory] = useState([]);
  const [tempKey, setTempKey] = useState('');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');

  const loadHistory = async () => {
    try {
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const loadModels = async () => {
    try {
      const data = await fetchModels();
      setModels(data.models);
      if (data.models.length > 0) setSelectedModel(data.models[0]);
    } catch (err) {
      console.error('Failed to load models', err);
    }
  };

  useEffect(() => {
    loadHistory();
    loadModels();
  }, []);

  const handleSaveKey = () => {
    localStorage.setItem('openrouter_key', tempKey);
    setApiKey(tempKey);
    setError(null);
  };

  const handleAnalyze = async (category, subreddits) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await analyzeNiche(category, subreddits, apiKey, selectedModel);
      setSignals(data.signals);
      loadHistory(); // Refresh history
    } catch (err) {
      if (err.message === 'API_KEY_REQUIRED') {
        setError({ type: 'auth', message: 'OpenRouter API Key is required.' });
      } else if (err.message === 'RATE_LIMIT') {
        setError({ type: 'rate', message: 'OpenRouter API rate limit reached.' });
      } else {
        setError({ type: 'general', message: 'Analysis failed. Try adjusting the subreddits or try again later.' });
      }
    }
    setIsAnalyzing(false);
  };

  const handleLoadHistory = async (id) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const data = await fetchAnalysis(id);
      setSignals(data.signals);
    } catch (err) {
      setError({ type: 'general', message: 'Failed to load historical analysis.' });
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="app-container">
      <header className="header" style={{ display: 'flex', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingUp color="var(--accent-color)" size={32} />
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>Market Research</h1>
        </div>
      </header>

      <main className="main-content" style={{ gridTemplateColumns: '350px 1fr', padding: '1rem 2rem', gap: '2rem' }}>
        {/* Left Column: Configuration & History Sidebar */}
        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <ConfigurationPanel 
             onAnalyze={handleAnalyze} 
             apiKey={apiKey} 
             onError={setError} 
             models={models}
             selectedModel={selectedModel}
             setSelectedModel={setSelectedModel}
           />
           
           <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
             <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
               <History size={18} /> Analysis History
             </h3>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
               {history.length === 0 ? (
                 <p className="text-secondary" style={{ fontSize: '0.9rem' }}>No past analyses.</p>
               ) : (
                 history.map(item => (
                   <div 
                     key={item.id} 
                     className="history-card"
                     onClick={() => handleLoadHistory(item.id)}
                     style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}
                     onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                     onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                   >
                     <div style={{ fontWeight: '600', marginBottom: '0.2rem' }}>{item.category}</div>
                     <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                       {item.subreddits.length} subreddits • {new Date(item.created_at).toLocaleDateString()}
                     </div>
                     <div style={{ fontSize: '0.7rem', color: 'var(--accent-color)', marginTop: '0.3rem', opacity: 0.8 }}>
                       {item.model_used || 'Unknown Model'}
                     </div>
                   </div>
                 ))
               )}
             </div>
           </div>
        </aside>

        {/* Right Column: Insights Dashboard */}
        <section className="dashboard">
           {isAnalyzing ? (
             <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
               <Loader2 size={48} color="var(--accent-color)" className="spinner" />
               <h2 style={{ fontSize: '1.4rem' }}>Analyzing discussions...</h2>
               <p className="text-secondary">Scraping posts and generating market signals.</p>
             </div>
           ) : error ? (
             <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', textAlign: 'center' }}>
                <p style={{ color: '#f43f5e', fontSize: '1.1rem', fontWeight: 'bold' }}>{error.message}</p>
                
                {error.type === 'auth' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '300px', marginTop: '1rem' }}>
                    <input 
                      type="password" 
                      placeholder="sk-or-v1-..." 
                      className="search-input" 
                      value={tempKey}
                      onChange={e => setTempKey(e.target.value)}
                    />
                    <button className="btn-primary" onClick={handleSaveKey}>Save Key</button>
                  </div>
                )}

                {error.type === 'rate' && (
                  <a href="https://openrouter.ai/" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'underline', marginTop: '1rem' }}>
                    Check your OpenRouter limits
                  </a>
                )}
             </div>
           ) : (
             <InsightsDashboard signals={signals} />
           )}
        </section>
      </main>
    </div>
  );
}

export default App;
