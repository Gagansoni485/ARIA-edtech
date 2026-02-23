// src/components/Visualizer.jsx
import React, { useEffect, useRef } from 'react';

export default function Visualizer({ volumeLevel = 0, isActive = false, color = '#7c6af7', barCount = 20 }) {
  const barsRef = useRef([]);
  useEffect(() => {
    barsRef.current.forEach((bar, i) => {
      if (!bar) return;
      const wave   = isActive ? Math.sin(Date.now() / 180 + i * 0.6) * (volumeLevel * 0.5) : 0;
      const height = Math.max(3, Math.min(38, isActive ? (volumeLevel * 0.4 + wave + Math.random() * 6) : 3));
      bar.style.height  = `${height}px`;
      bar.style.opacity = isActive ? `${0.35 + (height / 38) * 0.65}` : '0.15';
    });
  });
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:42 }}>
      {Array.from({ length: barCount }).map((_, i) => (
        <div key={i} ref={(el) => { barsRef.current[i] = el; }}
          style={{ width:2.5, height:3, borderRadius:2, background:color, transition:'height 0.07s ease, opacity 0.07s ease', opacity:0.15 }}
        />
      ))}
    </div>
  );
}