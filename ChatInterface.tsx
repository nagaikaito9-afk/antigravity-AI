import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Message } from '../hooks/useAIGrowth';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

export const ChatInterface = ({ messages, onSendMessage }: ChatInterfaceProps) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <div style={{ padding: '1rem', borderBottom: '1px solid var(--panel-border)', background: 'rgba(0,0,0,0.2)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Chat</h3>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              padding: '0.8rem 1.2rem',
              borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
              background: msg.sender === 'user' ? 'var(--accent-glow)' : 'rgba(255,255,255,0.05)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--panel-border)',
              color: 'white',
              fontSize: '0.95rem',
              lineHeight: '1.4'
            }}
          >
            {msg.text}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '1rem', borderTop: '1px solid var(--panel-border)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.2)' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="メッセージを入力..."
          style={{
            flex: 1,
            padding: '0.8rem 1rem',
            borderRadius: '24px',
            border: '1px solid var(--panel-border)',
            background: 'rgba(255,255,255,0.05)',
            color: 'white',
            outline: 'none',
            fontSize: '0.95rem'
          }}
        />
        <button
          type="submit"
          disabled={!input.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: input.trim() ? `var(--level-5)` : 'rgba(255,255,255,0.1)',
            border: 'none',
            color: 'white',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
};
