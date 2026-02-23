// src/components/MessageBubble.jsx
import React, { useEffect, useRef, useState } from 'react';

// Animated waveform bars
const Waveform = ({ volume, active }) => {
  const bars = 12;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 28 }}>
      {Array.from({ length: bars }).map((_, i) => {
        const base = 3;
        const max  = active ? Math.max(4, (volume / 100) * 24) : 4;
        const height = active
          ? base + Math.abs(Math.sin((Date.now() / 200) + i * 0.7)) * max
          : base;
        return (
          <div
            key={i}
            style={{
              width: 2.5,
              height: active ? undefined : base,
              minHeight: base,
              maxHeight: 28,
              background: active ? '#a78bfa' : '#2a2a3a',
              borderRadius: 2,
              transition: 'height 0.08s ease',
              alignSelf: 'center',
              animation: active ? `wave ${0.4 + (i % 4) * 0.1}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.05}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes wave {
          from { height: 3px; }
          to   { height: 22px; }
        }
      `}</style>
    </div>
  );
};

export default function MessageBubble({ isAiSpeaking, aiVolumeLevel, outputTranscript, isThinking }) {
  const textRef = useRef(null);

  // Auto-scroll transcript
  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [outputTranscript]);

  const getStatus = () => {
    if (isThinking)    return { label: 'Thinking…',  color: '#f59e0b', pulse: true };
    if (isAiSpeaking)  return { label: 'Speaking',   color: '#a78bfa', pulse: false };
    return               { label: 'Ready',            color: '#4b5563', pulse: false };
  };

  const st = getStatus();

  return (
    <div style={{
      background: '#0f0f1a',
      border: `1px solid ${isAiSpeaking ? '#7c6af740' : isThinking ? '#f59e0b30' : '#1e1e2e'}`,
      borderRadius: 12,
      padding: '12px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      transition: 'border-color 0.3s',
      boxShadow: isAiSpeaking ? '0 0 20px #7c6af714' : 'none',
      minHeight: 90,
    }}>
      {/* Top row: avatar + name + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: isAiSpeaking ? '#1a0d35' : '#111',
          border: `1px solid ${isAiSpeaking ? '#7c6af760' : '#2a2a3a'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
          transition: 'all 0.3s',
        }}>
          🤖
        </div>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: 12,
            color: '#a78bfa', fontWeight: 700, letterSpacing: '0.08em',
          }}>
            ARIA
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: st.color,
              boxShadow: st.pulse ? `0 0 6px ${st.color}` : 'none',
              animation: st.pulse ? 'statusPulse 1s ease-in-out infinite' : 'none',
            }} />
            <span style={{
              fontSize: 10, color: st.color,
              fontFamily: "'Space Mono', monospace",
            }}>
              {st.label}
            </span>
          </div>
        </div>
        {isAiSpeaking && (
          <Waveform volume={aiVolumeLevel} active={isAiSpeaking} />
        )}
      </div>

      {/* Transcript */}
      <div
        ref={textRef}
        style={{
          fontSize: 12,
          lineHeight: 1.65,
          color: outputTranscript ? '#c4c0e0' : '#4b5563',
          fontStyle: outputTranscript ? 'normal' : 'italic',
          maxHeight: 90,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          transition: 'color 0.3s',
          wordBreak: 'break-word',
        }}
      >
        {isThinking
          ? <ThinkingDots />
          : outputTranscript || 'Waiting for your question…'
        }
      </div>

      <style>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// Animated thinking dots
const ThinkingDots = () => (
  <span style={{ color: '#f59e0b' }}>
    Working it out
    <span style={{ display: 'inline-flex', gap: 2, marginLeft: 2 }}>
      {[0,1,2].map(i => (
        <span key={i} style={{
          display: 'inline-block',
          animation: `dot 1.2s ease-in-out ${i * 0.2}s infinite`,
        }}>.</span>
      ))}
    </span>
    <style>{`
      @keyframes dot {
        0%, 80%, 100% { opacity: 0; transform: translateY(0); }
        40% { opacity: 1; transform: translateY(-3px); }
      }
    `}</style>
  </span>
);