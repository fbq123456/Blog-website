import { useState, useEffect } from 'react';

interface CounterProps {
  initialCount?: number;
  label?: string;
}

export default function Counter({ 
  initialCount = 0, 
  label = '计数' 
}: CounterProps) {
  const [count, setCount] = useState(initialCount);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (count !== initialCount) {
      setAnimate(true);
      const timer = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(timer);
    }
  }, [count, initialCount]);

  const buttonStyle = {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '6px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg-secondary)',
    color: 'var(--color-text)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const displayStyle = {
    fontSize: '48px',
    fontWeight: 700,
    fontFamily: 'var(--font-mono)',
    color: 'var(--color-accent)',
    transform: animate ? 'scale(1.1)' : 'scale(1)',
    transition: 'transform 0.2s ease',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '24px',
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
      }}
    >
      <span style={{ fontSize: '14px', color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div style={displayStyle}>{count}</div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setCount((c) => c - 1)}
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-elevated)';
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          -1
        </button>
        <button
          onClick={() => setCount(initialCount)}
          style={buttonStyle}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-elevated)';
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          重置
        </button>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={{
            ...buttonStyle,
            background: 'var(--color-accent)',
            color: 'var(--color-bg)',
            borderColor: 'var(--color-accent)',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'var(--color-accent-hover)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'var(--color-accent)';
          }}
        >
          +1
        </button>
      </div>
    </div>
  );
}
