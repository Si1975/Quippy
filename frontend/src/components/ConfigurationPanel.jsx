import { useState } from 'react';
import { Search, Loader2, Plus, X, Play } from 'lucide-react';
import { ideateSubreddits } from '../services/api';

export default function ConfigurationPanel({ onAnalyze, apiKey, onError, models, selectedModel, setSelectedModel, signalsConfig, setSignalsConfig }) {
  const [category, setCategory] = useState('');
  const [subreddits, setSubreddits] = useState([]);
  const [newSub, setNewSub] = useState('');
  const [isIdeating, setIsIdeating] = useState(false);
  const [newSignalKey, setNewSignalKey] = useState('');
  const [newSignalLabel, setNewSignalLabel] = useState('');
  const [newSignalDesc, setNewSignalDesc] = useState('');
  const [showCustomSignal, setShowCustomSignal] = useState(false);

  const handleIdeate = async () => {
    if (!category) return;
    setIsIdeating(true);
    onError(null);
    try {
      const data = await ideateSubreddits(category, apiKey, selectedModel);
      // Merge unique
      const merged = Array.from(new Set([...subreddits, ...(data.subreddits || [])]));
      setSubreddits(merged);
    } catch (err) {
      if (err.message === 'API_KEY_REQUIRED') {
        onError({ type: 'auth', message: 'OpenRouter API Key is required.' });
      } else if (err.message === 'RATE_LIMIT') {
        onError({ type: 'rate', message: 'OpenRouter API rate limit reached.' });
      } else {
        onError({ type: 'general', message: 'Failed to auto-ideate subreddits.' });
      }
    }
    setIsIdeating(false);
  };

  const handleAddSub = (e) => {
    if (e.key === 'Enter' && newSub) {
      if (!subreddits.includes(newSub)) {
        setSubreddits([...subreddits, newSub]);
      }
      setNewSub('');
    }
  };

  const handleRemoveSub = (sub) => {
    setSubreddits(subreddits.filter(s => s !== sub));
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
      
      {/* Content wrapper */}
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Section */}
        <div style={{ flexShrink: 0 }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={20} color="var(--accent-color)" /> Niche Category
          </h2>
          <div className="search-container" style={{ width: '100%', maxWidth: 'none', margin: '0' }}>
            <input
              type="text"
              className="search-input"
              placeholder="e.g. Wall Art, Mechanical Keyboards..."
              value={category}
              onChange={e => setCategory(e.target.value)}
            />
        </div>
      </div>

      {models && models.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>AI Model</h3>
          <select
            className="search-input"
            style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', outline: 'none' }}
            value={selectedModel}
            onChange={e => setSelectedModel(e.target.value)}
          >
            {models.map(m => (
              <option key={m} value={m} style={{ background: '#111' }}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexShrink: 0 }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Target Subreddits</h3>
          <button
            className="btn-outline"
            onClick={handleIdeate}
            disabled={isIdeating || !category}
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
          >
            {isIdeating ? <Loader2 size={14} className="spinner" /> : 'Suggest Subreddits'}
          </button>
        </div>

        <div className="subreddits-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', flexShrink: 0 }}>
          {subreddits.map(sub => (
            <span key={sub} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              r/{sub}
              <X size={12} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={() => handleRemoveSub(sub)} />
            </span>
          ))}
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '0.2rem 0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)', marginRight: '4px' }}>r/</span>
            <input
              type="text"
              style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', width: '80px', fontSize: '0.85rem' }}
              placeholder="add..."
              value={newSub}
              onChange={e => setNewSub(e.target.value)}
              onKeyDown={handleAddSub}
            />
          </div>
        </div>
        
        {/* Advanced Options (Always Visible) */}
        <div style={{ marginTop: '1rem', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="glass-panel animate-fade-in" style={{ marginTop: '0.5rem', padding: '1rem', flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Active Signals</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem', flex: '1 1 0', minHeight: 0, overflowY: 'auto', paddingRight: '0.5rem' }}>
              {signalsConfig.map(sig => (
                <label key={sig.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={sig.active} 
                    onChange={() => {
                      const next = signalsConfig.map(s => s.key === sig.key ? { ...s, active: !s.active } : s);
                      setSignalsConfig(next);
                    }} 
                    style={{ marginTop: '0.2rem' }}
                  />
                  <div>
                    <strong style={{ color: sig.active ? '#fff' : 'var(--text-secondary)' }}>{sig.label}</strong>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.1rem' }}>{sig.description}</div>
                  </div>
                </label>
              ))}
            </div>
            
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', flexShrink: 0 }}>
              <div 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => setShowCustomSignal(!showCustomSignal)}
              >
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Add Custom Signal</h4>
                <button className="btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', background: 'none', border: 'none' }}>
                  {showCustomSignal ? '−' : '+'}
                </button>
              </div>
              
              {showCustomSignal && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.8rem' }}>
                  <input type="text" placeholder="Key (e.g. brand_mentions)" className="input-field" style={{ fontSize: '0.9rem' }} value={newSignalKey} onChange={e => setNewSignalKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))} />
                <input type="text" placeholder="Label (e.g. Brand Mentions)" className="input-field" style={{ fontSize: '0.9rem' }} value={newSignalLabel} onChange={e => setNewSignalLabel(e.target.value)} />
                <input type="text" placeholder="Description (e.g. people mentioning specific brands)" className="input-field" style={{ fontSize: '0.9rem' }} value={newSignalDesc} onChange={e => setNewSignalDesc(e.target.value)} />
                <button 
                  className="btn-outline" 
                  style={{ fontSize: '0.9rem', padding: '0.6rem' }} 
                  disabled={!newSignalKey || !newSignalLabel || !newSignalDesc} 
                  onClick={() => {
                    if (!signalsConfig.some(s => s.key === newSignalKey)) {
                      setSignalsConfig([...signalsConfig, { key: newSignalKey, label: newSignalLabel, description: newSignalDesc, active: true, default: false }]);
                    }
                    setNewSignalKey(''); setNewSignalLabel(''); setNewSignalDesc('');
                  }}
                >
                  <Plus size={14} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> Add Signal
                </button>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      </div> {/* closes scroll container */}

      <div style={{ marginTop: '1rem', flexShrink: 0 }}>
        <button
          className="btn-primary"
          style={{ width: '100%', padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}
          onClick={() => onAnalyze(category, subreddits)}
          disabled={!category || subreddits.length === 0}
        >
          <Play size={18} /> Run Market Analysis
        </button>
      </div>
    </div>
  );
}
