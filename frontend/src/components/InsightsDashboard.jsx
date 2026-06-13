import { useState } from 'react';
import { ShoppingCart, SearchX, Palette, Home, Gift, TrendingUp, PaintBucket, LayoutGrid, List, Tag } from 'lucide-react';

export default function InsightsDashboard({ signals, metadata, viewMode, setViewMode }) {
  if (!signals) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
         <p className="text-secondary" style={{ fontSize: '1.2rem' }}>Enter a category and run an analysis to uncover market insights.</p>
      </div>
    );
  }

  const DEFAULT_ICONS = {
    buying_signals: { icon: <ShoppingCart size={24} color="#10b981" />, color: 'rgba(16, 185, 129, 0.1)' },
    unmet_demand: { icon: <SearchX size={24} color="#f43f5e" />, color: 'rgba(244, 63, 94, 0.1)' },
    style_requests: { icon: <Palette size={24} color="#a855f7" />, color: 'rgba(168, 85, 247, 0.1)' },
    room_specific: { icon: <Home size={24} color="#3b82f6" />, color: 'rgba(59, 130, 246, 0.1)' },
    gift_related: { icon: <Gift size={24} color="#f59e0b" />, color: 'rgba(245, 158, 11, 0.1)' },
    trend_spotting: { icon: <TrendingUp size={24} color="#06b6d4" />, color: 'rgba(6, 182, 212, 0.1)' },
    colour_trends: { icon: <PaintBucket size={24} color="#ec4899" />, color: 'rgba(236, 72, 153, 0.1)' }
  };

  const getCardStyle = (key) => DEFAULT_ICONS[key] || { icon: <Tag size={24} color="#a1a1aa" />, color: 'rgba(161, 161, 170, 0.1)' };

  const displayCards = metadata?.signalsConfig?.length > 0 
    ? metadata.signalsConfig.map(s => ({ ...s, label: s.label || s.key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }))
    : Object.keys(signals).map(key => ({ key, label: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        {metadata ? (
          <div className="glass-panel" style={{ padding: '1.2rem', flex: 1, marginRight: '1rem', borderLeft: '4px solid var(--accent-color)' }}>
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{metadata.category}</h2>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
               <span><strong style={{color: 'var(--text-primary)'}}>Model:</strong> {metadata.model_used || 'Unknown'}</span>
               <span><strong style={{color: 'var(--text-primary)'}}>Subreddits:</strong> {metadata.subreddits.map(s => 'r/' + s).join(', ')}</span>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1 }}></div>
        )}
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
           <button 
           className="btn-outline" 
           style={{ padding: '0.4rem', border: viewMode === 'grid' ? '1px solid var(--accent-color)' : '', color: viewMode === 'grid' ? 'var(--accent-color)' : '' }}
           onClick={() => setViewMode('grid')}
           title="Grid View"
         >
           <LayoutGrid size={18} />
         </button>
         <button 
           className="btn-outline" 
           style={{ padding: '0.4rem', border: viewMode === 'list' ? '1px solid var(--accent-color)' : '', color: viewMode === 'list' ? 'var(--accent-color)' : '' }}
           onClick={() => setViewMode('list')}
           title="List View"
         >
           <List size={18} />
         </button>
      </div>
      </div>
      <div className={viewMode === 'grid' ? 'insights-grid animate-fade-in' : 'insights-list animate-fade-in'}>
        {displayCards.map((card, index) => {
          const style = getCardStyle(card.key);
          return (
          <div key={card.key} className="glass-panel insight-card" style={{ animationDelay: (index * 0.05) + 's' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ background: style.color, padding: '0.6rem', borderRadius: '12px' }}>
                  {style.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{card.label}</h3>
             </div>
             <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
               {signals[card.key] || 'No specific insights found for this metric.'}
             </p>
          </div>
        )})}
      </div>
    </div>
  );
}
