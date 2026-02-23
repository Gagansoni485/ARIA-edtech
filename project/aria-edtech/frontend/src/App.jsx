// src/App.jsx
import React, { useState, useCallback, useRef } from 'react';
import Whiteboard    from './components/Whiteboard';
import UserTile      from './components/UserTile';
import MessageBubble from './components/MessageBubble';
import ControlBar     from './components/ControlBar';
import { useGeminiLive } from './hooks/useGeminiLive';

export default function App() {
  const [question, setQuestion] = useState('');

  const {
    connect, disconnect, sendTextMessage, sendExplainRequest,
    connectionState, stepsJson,
    userVolumeLevel, aiVolumeLevel,
    isAiSpeaking, isThinking,
    isMicOn, toggleMic,
    inputTranscript, outputTranscript,
  } = useGeminiLive();

  const inputRef    = useRef(null);
  const isConnected = connectionState === 'CONNECTED';

  const handleSend = useCallback(() => {
    const q = question.trim();
    if (!q || !isConnected) return;
    sendTextMessage(q);
    setQuestion('');
    inputRef.current?.focus();
  }, [question, sendTextMessage, isConnected]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleExplain = useCallback((completedSteps) => {
    if (!completedSteps?.length) return;
    // Use dedicated explain path — does NOT interrupt via processUserMessage
    sendExplainRequest(completedSteps);
  }, [sendExplainRequest]);

  const handleExample = (ex) => {
    setQuestion(ex);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const EXAMPLES = [
    'Solve x² + 5x + 6 = 0',
    'Integrate ∫x²dx from 0 to 3',
    "Explain Newton's 2nd law",
    'Derive kinematic equations',
    "Explain Ohm's law",
    'What is the quadratic formula?',
  ];

  return (
    <div style={S.root}>
      {/* ── Left: Whiteboard ── */}
      <div style={S.left}>
        <Whiteboard
          stepsJson={stepsJson}
          onExplain={handleExplain}
          isAiSpeaking={isAiSpeaking}
        />
      </div>

      {/* ── Right: ARIA panel ── */}
      <div style={S.right}>
        <div style={S.rightHeader}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={S.ariaAvatar}>🤖</div>
            <div>
              <div style={S.ariaTitle}>ARIA</div>
              <div style={S.ariaSubtitle}>Advanced Reasoning & Interactive Assistant</div>
            </div>
          </div>
        </div>

        <div style={S.tilesArea}>
          <MessageBubble
            isAiSpeaking={isAiSpeaking}
            aiVolumeLevel={aiVolumeLevel}
            outputTranscript={outputTranscript}
            isThinking={isThinking}
          />
          <UserTile
            volumeLevel={userVolumeLevel}
            isMicOn={isMicOn}
            inputTranscript={inputTranscript}
          />
        </div>

        <div style={S.divider} />

        <div style={S.inputArea}>
          <div style={S.inputLabel}>Ask a question</div>
          <div style={S.inputRow}>
            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? 'Type a math or physics problem…' : 'Start a session first…'}
              disabled={!isConnected}
              rows={3}
              style={{
                ...S.textarea,
                opacity: isConnected ? 1 : 0.45,
                cursor:  isConnected ? 'text' : 'not-allowed',
              }}
            />
            <button
              onClick={handleSend}
              disabled={!isConnected || !question.trim()}
              style={{
                ...S.sendBtn,
                opacity: (isConnected && question.trim()) ? 1 : 0.35,
                cursor:  (isConnected && question.trim()) ? 'pointer' : 'not-allowed',
              }}
            >▶</button>
          </div>
          <div style={S.hint}>Enter to send · Shift+Enter for new line · or just speak!</div>

          {isConnected && (
            <div style={S.examples}>
              <div style={S.examplesLabel}>Quick examples:</div>
              <div style={S.chips}>
                {EXAMPLES.map((ex) => (
                  <button key={ex} onClick={() => handleExample(ex)} style={S.chip}>{ex}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <ControlBar
          connectionState={connectionState}
          onConnect={connect}
          onDisconnect={disconnect}
          isMicOn={isMicOn}
          onToggleMic={toggleMic}
          isThinking={isThinking}
        />
      </div>
    </div>
  );
}

const S = {
  // Root spans full viewport — this is the single source of truth for height
  root: {
    display: 'flex',
    width: '100vw',
    height: '100vh',
    background: '#08080f',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', system-ui, sans-serif",
  },
  // Left panel: flex:1 to fill space, minHeight:0 so children can scroll
  left: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,        // ← THE FIX: allows flex child to shrink & scroll
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',  // ← contain the whiteboard, don't let it bleed out
  },
  // Right panel: fixed width, flex column, children handle their own scroll
  right: {
    width: 360,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,        // ← same fix for right column
    background: '#09090f',
    borderLeft: '1px solid #1e1e2e',
    overflow: 'hidden',
  },
  rightHeader:  { padding:'14px 18px', borderBottom:'1px solid #1e1e2e', background:'#0a0a12', flexShrink:0 },
  ariaAvatar:   { width:38, height:38, borderRadius:'50%', background:'#1a0d35', border:'1px solid #7c6af740', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 },
  ariaTitle:    { fontFamily:"'Space Mono',monospace", fontSize:15, color:'#a78bfa', fontWeight:700, letterSpacing:'0.12em' },
  ariaSubtitle: { fontSize:10, color:'#6b7280', marginTop:2 },
  tilesArea:    { padding:'14px', display:'flex', flexDirection:'column', gap:10, flexShrink:0 },
  divider:      { height:1, background:'#1e1e2e', margin:'0 16px', flexShrink:0 },
  inputArea:    { flex:1, padding:'14px', display:'flex', flexDirection:'column', gap:8, minHeight:0, overflowY:'auto' },
  inputLabel:   { fontFamily:"'Space Mono',monospace", fontSize:10, color:'#6b7280', letterSpacing:'0.1em', textTransform:'uppercase' },
  inputRow:     { display:'flex', gap:8, alignItems:'flex-end' },
  textarea:     { flex:1, background:'#0f0f1a', color:'#e0deff', border:'1px solid #2a2a3a', borderRadius:8, padding:'10px 12px', fontSize:13, lineHeight:1.5, resize:'none', outline:'none', fontFamily:'inherit', scrollbarWidth:'thin' },
  sendBtn:      { width:40, height:40, borderRadius:8, background:'#1a0d35', border:'1px solid #7c6af760', color:'#a78bfa', fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, outline:'none' },
  hint:         { fontSize:10, color:'#4b5563', fontFamily:"'Space Mono',monospace" },
  examples:     { display:'flex', flexDirection:'column', gap:6 },
  examplesLabel:{ fontSize:10, color:'#4b5563', fontFamily:"'Space Mono',monospace" },
  chips:        { display:'flex', flexWrap:'wrap', gap:5 },
  chip:         { background:'#0f0f1a', color:'#6b7280', border:'1px solid #1e1e2e', borderRadius:20, padding:'3px 10px', fontSize:10, cursor:'pointer', fontFamily:"'Space Mono',monospace", outline:'none' },
};