import { motion } from 'framer-motion';

export const AIOrb = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <motion.div
        style={{
          width: '120px',
          height: '120px',
          background: 'var(--level-5)',
          boxShadow: '0 0 60px var(--level-5)',
        }}
        animate={{ scale: [0.95, 1.05, 0.95], borderRadius: ["50%", "50%", "50%"], rotate: [0, -360] }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Advanced AI</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>System Active</p>
      </div>
    </div>
  );
};
