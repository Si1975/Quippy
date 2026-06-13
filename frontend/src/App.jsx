import { useState } from 'react';
import { TrendingUp, Loader2 } from 'lucide-react';
import ConfigurationPanel from './components/ConfigurationPanel';
import InsightsDashboard from './components/InsightsDashboard';
import { analyzeNiche } from './services/api';

function App() {
  const [signals, setSignals] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (category, subreddits) => {
    setIsAnalyzing(true);
    setError('');
    try {
      const data = await analyzeNiche(category, subreddits);
      setSignals(data.signals);
    } catch (err) {
      console.error(err);
      setError('Analysis failed. Try adjusting the subreddits or try again later.');
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
        {/* Left Column: Configuration Sidebar */}
        <aside className="sidebar">
           <ConfigurationPanel onAnalyze={handleAnalyze} />
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
             <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f43f5e' }}>
                <p>{error}</p>
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
