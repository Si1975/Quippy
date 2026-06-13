import { useState } from 'react';
import { ShoppingCart, SearchX, Palette, Home, Gift, TrendingUp, PaintBucket, LayoutGrid, List } from 'lucide-react';

export default function InsightsDashboard({ signals, metadata }) {
  const [viewMode, setViewMode] = useState('grid');
  if (!signals) {
    return (
      <div className="glass-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center' }}>
         <p className="text-secondary" style={{ fontSize: '1.2rem' }}>Enter a category and run an analysis to uncover market insights.</p>
      </div>
    );
  }

  const cards = [
    { key: 'buying_signals', label: 'Buying Signals', icon: <ShoppingCart size={24} color="#10b981" />, color: 'rgba(16, 185, 129, 0.1)' },
    { key: 'unmet_demand', label: 'Unmet Demand', icon: <SearchX size={24} color="#f43f5e" />, color: 'rgba(244, 63, 94, 0.1)' },
    { key: 'style_requests', label: 'Style Requests', icon: <Palette size={24} color="#a855f7" />, color: 'rgba(168, 85, 247, 0.1)' },
    { key: 'room_specific', label: 'Room Specific Needs', icon: <Home size={24} color="#3b82f6" />, color: 'rgba(59, 130, 246, 0.1)' },
    { key: 'gift_related', label: 'Gift & Custom Demand', icon: <Gift size={24} color="#f59e0b" />, color: 'rgba(245, 158, 11, 0.1)' },
    { key: 'trend_spotting', label: 'Trend Spotting', icon: <TrendingUp size={24} color="#06b6d4" />, color: 'rgba(6, 182, 212, 0.1)' },
    { key: 'colour_trends', label: 'Colour Trends', icon: <PaintBucket size={24} color="#ec4899" />, color: 'rgba(236, 72, 153, 0.1)' }
  ];

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
      <div className={viewMode === 'grid' ? 'insights-grid animate-fade-in' : 'insights-list animate-fade-in'}>
        {cards.map((card, index) => (
          <div key={card.key} className="glass-panel insight-card" style={{ animationDelay: (index * 0.05) + 's' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <div style={{ background: card.color, padding: '0.6rem', borderRadius: '12px' }}>
                  {card.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>{card.label}</h3>
             </div>
             <p style={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
               {signals[card.key] || 'No specific insights found for this metric.'}
             </p>
          </div>
        ))}
      </div>
    </div>
  );
}
