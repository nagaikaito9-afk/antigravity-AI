import { useAIGrowth } from './hooks/useAIGrowth';
import { AIOrb } from './components/AIOrb';
import { ChatInterface } from './components/ChatInterface';
import { RotateCcw } from 'lucide-react';
import './index.css';

function App() {
  const { messages, aiState, sendMessage, resetData } = useAIGrowth();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '1000px',
        height: '90vh',
        borderRadius: '24px',
        display: 'flex',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Left Side: AI Visage & Stats */}
        <div style={{
          flex: '0 0 350px',
          borderRight: '1px solid var(--panel-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '2rem',
          background: 'rgba(0,0,0,0.2)'
        }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '2rem', background: 'linear-gradient(to right, #60a5fa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', textAlign: 'center' }}>
            Advanced AI Partner
          </h1>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AIOrb />
          </div>

          <div style={{ width: '100%', marginTop: '2rem' }}>
            <button
              onClick={() => {
                if(window.confirm('本当に会話の履歴と記憶をすべて消去しますか？')) {
                  resetData();
                }
              }}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '12px',
                border: '1px solid rgba(244, 63, 94, 0.5)',
                background: 'rgba(244, 63, 94, 0.1)',
                color: '#f43f5e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)';
              }}
            >
              <RotateCcw size={16} />
              Reset Conversation
            </button>
          </div>
          
          <div style={{ width: '100%', marginTop: '2rem', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Memory Keywords</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {aiState.memory.length === 0 ? (
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>No memories yet...</span>
              ) : (
                aiState.memory.slice(-10).map((mem, idx) => (
                  <span key={idx} style={{
                    fontSize: '0.75rem',
                    padding: '0.2rem 0.5rem',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: 'var(--text-primary)'
                  }}>
                    {mem}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Chat Interface */}
        <div style={{ flex: 1, height: '100%', background: 'rgba(0,0,0,0.1)' }}>
          <ChatInterface 
            messages={messages} 
            onSendMessage={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
