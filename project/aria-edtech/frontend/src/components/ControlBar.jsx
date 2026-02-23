// src/components/ControlBar.jsx
import React from 'react';
import { ConnectionState } from '../types';

export default function ControlBar({
  connectionState,
  onConnect,
  onDisconnect,
  isMicOn,
  onToggleMic,
  isThinking,
}) {
  const isConnected   = connectionState === ConnectionState.CONNECTED;
  const isConnecting  = connectionState === ConnectionState.CONNECTING;
  const isError       = connectionState === ConnectionState.ERROR;

  return (
    <div style={S.bar}>
      {/* Status indicator */}
      <div style={S.statusRow}>
        <span style={{ ...S.dot, background: isConnected ? '#22c55e' : isConnecting ? '#f59e0b' : isError ? '#ef4444' : '#6b7280' }} />
        <span style={S.statusText}>
          {isConnected ? 'CONNECTED' : isConnecting ? 'CONNECTING…' : isError ? 'ERROR' : 'DISCONNECTED'}
        </span>
        {isThinking && <span style={S.thinkingBadge}>◐ Thinking…</span>}
      </div>

      {/* Controls */}
      <div style={S.controls}>
        {/* Mic toggle */}
        <button
          onClick={onToggleMic}
          disabled={!isConnected}
          title={isMicOn ? 'Mute microphone' : 'Unmute microphone'}
          style={{
            ...S.iconBtn,
            background: isMicOn ? '#0f1f0a' : '#2a0a0a',
            border:     `1px solid ${isMicOn ? '#22c55e40' : '#ef444440'}`,
            color:      isMicOn ? '#22c55e'  : '#ef4444',
            opacity:    isConnected ? 1 : 0.4,
          }}
        >
          {isMicOn ? '🎙' : '🔇'}
        </button>

        {/* Connect / Disconnect */}
        {!isConnected ? (
          <button
            onClick={onConnect}
            disabled={isConnecting}
            style={{
              ...S.mainBtn,
              background: isConnecting ? '#1a1a2e' : '#1a0d35',
              border:     `1px solid ${isConnecting ? '#7c6af750' : '#7c6af7'}`,
              color:      '#a78bfa',
              opacity:    isConnecting ? 0.7 : 1,
            }}
          >
            {isConnecting ? '⏳ Connecting…' : '▶ Start Session'}
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            style={{ ...S.mainBtn, background: '#1f0a0a', border: '1px solid #ef444460', color: '#ef4444' }}
          >
            ■ End Session
          </button>
        )}
      </div>
    </div>
  );
}

const S = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 20px', background: '#080810',
    borderTop: '1px solid #1e1e2e', flexShrink: 0,
  },
  statusRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: '50%' },
  statusText: {
    fontFamily: "'Space Mono', monospace", fontSize: 11,
    color: '#6b7280', letterSpacing: '0.1em',
  },
  thinkingBadge: {
    fontFamily: "'Space Mono', monospace", fontSize: 10,
    color: '#f59e0b', background: '#2a1f0a',
    border: '1px solid #f59e0b30', borderRadius: 20,
    padding: '1px 8px',
  },
  controls: { display: 'flex', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: '50%',
    fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    outline: 'none',
  },
  mainBtn: {
    padding: '8px 20px', borderRadius: 8,
    fontSize: 12, fontFamily: "'Space Mono', monospace",
    cursor: 'pointer', letterSpacing: '0.05em',
    outline: 'none', transition: 'all 0.2s',
  },
};