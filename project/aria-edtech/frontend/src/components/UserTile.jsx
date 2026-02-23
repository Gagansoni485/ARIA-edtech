// src/components/UserTile.jsx
import React from 'react';
import Visualizer from './Visualizer';

export default function UserTile({ volumeLevel, isMicOn, inputTranscript }) {
  return (
    <div style={S.tile}>
      <div style={S.top}>
        <div style={S.avatar}>🎓</div>
        <div style={S.info}>
          <span style={S.name}>You</span>
          <span style={{ ...S.micStatus, color: isMicOn ? '#22c55e' : '#ef4444' }}>
            {isMicOn ? '🎙 Mic on' : '🔇 Muted'}
          </span>
        </div>
        <Visualizer volumeLevel={volumeLevel} isActive={isMicOn && volumeLevel > 5} color="#22c55e" barCount={12} />
      </div>
      {inputTranscript && (
        <div style={S.transcript}>
          <span style={S.transcriptText}>"{inputTranscript}"</span>
        </div>
      )}
    </div>
  );
}
const S = {
  tile:           { background:'#0a100d', border:'1px solid #22c55e18', borderRadius:10, padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 },
  top:            { display:'flex', alignItems:'center', gap:10 },
  avatar:         { width:34, height:34, borderRadius:'50%', background:'#0f2018', border:'1px solid #22c55e30', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 },
  info:           { flex:1, display:'flex', flexDirection:'column', gap:2 },
  name:           { fontSize:13, color:'#86efac', fontWeight:500 },
  micStatus:      { fontSize:11, fontFamily:"'Space Mono',monospace" },
  transcript:     { paddingTop:4, borderTop:'1px solid #0d2016' },
  transcriptText: { fontSize:12, color:'#6b7280', fontStyle:'italic', lineHeight:1.5 },
};