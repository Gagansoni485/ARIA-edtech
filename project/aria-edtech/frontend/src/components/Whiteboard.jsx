// src/components/Whiteboard.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// ─── KaTeX loader ─────────────────────────────────────────────────────────────
function waitForKatex(ms = 8000) {
  return new Promise(resolve => {
    if (window.katex) return resolve(true);
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (window.katex) { clearInterval(iv); resolve(true); }
      else if (Date.now() - t0 > ms) { clearInterval(iv); resolve(false); }
    }, 80);
  });
}

// ─── Detect if a string is actual math or plain text ─────────────────────────
// Math: contains backslash commands, ^, _, or is mostly ASCII operators/digits
// Plain text (Hindi, etc): mostly unicode letters without math syntax
function isMathContent(s) {
  // Check non-ASCII (Hindi/Devanagari) FIRST — before any operator checks
  // A Hindi sentence may contain = or numbers but it is NOT math
  const nonAscii = (s.match(/[^\x00-\x7F]/g) || []).length;
  if (nonAscii > s.length * 0.25) return false;   // >25% non-ASCII = plain text

  if (s.includes('\\')) return true;             // has LaTeX backslash commands
  if (/[\^_{}]/.test(s)) return true;            // has math structure ^, _, {}
  if (/[=+\-*/<>]/.test(s)) return true;         // has math operators
  if (/\d/.test(s) && /[a-zA-Z]/.test(s)) return true; // mixed like 2x, f(x)
  return true;                                      // default: treat as math
}

// ─── Fix missing backslashes before known LaTeX commands ─────────────────────
// When model outputs "frac{a}{b}" instead of "\frac{a}{b}", fix it here
function fixLatex(s) {
  // Commands before { (structural): match "cmd{" not preceded by backslash
  const BRACE_CMDS = ['frac','boxed','sqrt','vec','hat','text','mathrm','mathbf','mathit'];
  // Commands standalone or before space/operator: no word boundary on left
  const STANDALONE_CMDS = [
    'cdot','times','pm','infty','leq','geq','neq','approx',
    'sin','cos','tan','ln','log','lim','sum','int','partial',
    'alpha','beta','gamma','theta','lambda','sigma','pi',
    'nabla','rightarrow','leftarrow','Rightarrow','Leftarrow',
    'left','right','forall','exists','to','equiv','sim','perp'
  ];
  let result = s;
  // Fix "cmd{" -> "\cmd{"  (not preceded by backslash)
  for (const cmd of BRACE_CMDS) {
    const re = new RegExp('(?<!\\\\)(' + cmd + ')(?=\\{)', 'g');
    result = result.replace(re, '\\' + cmd);
  }
  // Fix standalone: not preceded by backslash or letter, not followed by letter
  for (const cmd of STANDALONE_CMDS) {
    const re = new RegExp('(?<!\\\\)(?<![a-zA-Z])(' + cmd + ')(?![a-zA-Z])', 'g');
    result = result.replace(re, '\\' + cmd);
  }
  return result;
}

// ─── Pure KaTeX math renderer ────────────────────────────────────────────────
// CRITICAL: Always render the ref-bearing span — never switch JSX branches.
// Switching branches detaches the ref, causing el.current=null when useEffect fires.
const KatexMath = ({ raw, block }) => {
  const el  = useRef(null);
  const [ready, setReady] = useState(!!(window.katex && window.katex.render));

  // Wait for KaTeX if not yet loaded (handles `defer` or slow CDN)
  useEffect(() => {
    if (ready) return;
    waitForKatex().then(loaded => {
      if (loaded) setReady(true);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Render math whenever raw, block, or readiness changes
  useEffect(() => {
    if (!el.current) return;
    if (!ready || !(window.katex && window.katex.render)) {
      // KaTeX not ready yet — show plain text as placeholder
      el.current.textContent = raw;
      el.current.style.fontFamily = 'monospace';
      el.current.style.color = '#c4b5fd';
      el.current.style.fontSize = '13px';
      return;
    }
    const fixed = fixLatex(raw);
    try {
      window.katex.render(fixed, el.current, {
        throwOnError: false,
        strict: 'ignore',
        displayMode: !!block,
        trust: true,
      });
      // Reset any placeholder styles KaTeX may not clear
      el.current.style.fontFamily = '';
      el.current.style.color = '';
      el.current.style.fontSize = '';
    } catch (e) {
      // Graceful fallback: show cleaned text
      el.current.textContent = raw.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
    }
  }, [raw, block, ready]);

  // ALWAYS return the same span with ref — never switch branches
  return (
    <span
      ref={el}
      className="kb"
      style={{
        display: block ? 'block' : 'inline-block',
        verticalAlign: 'middle',
        minHeight: '1em',
      }}
    />
  );
};

// ─── KaTeX wrapper — strips delimiters, detects math vs plain text ────────────
const Katex = ({ src, block }) => {
  // Strip dollar delimiters — slice-based, NO regex, preserves backslashes
  let raw = src;
  if (raw.startsWith('$$') && raw.endsWith('$$') && raw.length > 4) {
    raw = raw.slice(2, raw.length - 2);
  } else if (raw.startsWith('$') && raw.endsWith('$') && raw.length > 2) {
    raw = raw.slice(1, raw.length - 1);
  }
  raw = raw.trim();

  // If not actual math (e.g. Hindi/Devanagari text), render as plain text
  if (!isMathContent(raw)) {
    return (
      <span style={{
        display: block ? 'block' : 'inline',
        color: '#b0adcc', fontFamily: 'inherit', fontSize: 'inherit',
        textAlign: block ? 'center' : 'inherit', padding: block ? '8px 0' : 0,
      }}>
        {raw}
      </span>
    );
  }

  return <KatexMath raw={raw} block={block} />;
};

// ─── Sanitize a line string coming from parsed JSON ─────────────────────────
// Belt-and-suspenders: fix any surviving control chars before we scan for $ delimiters
// These chars come from the model outputting single-backslash LaTeX in JSON strings
function sanitizeLine(s) {
  return s
    .replace(/[\b]/g, '\\b')   // backspace  → \b  (\boxed, \beta)
    .replace(/[\f]/g, '\\f')   // form-feed  → \f  (\frac)
    // Normalize LLM alternate delimiters to $...$ 
    .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
    .replace(/\\\(/g, '$').replace(/\\\)/g, '$');
}

// ─── Parse a line into text/math segments ────────────────────────────────────
// Uses indexOf — no regex — so backslashes are never touched
function parseSegments(line) {
  line = sanitizeLine(line);  // fix control chars before scanning
  const out = [];
  let i = 0;
  const s = line;
  while (i < s.length) {
    const d = s.indexOf('$', i);
    if (d === -1) { out.push({ t: 'txt', v: s.slice(i) }); break; }
    if (d > i)    out.push({ t: 'txt', v: s.slice(i, d) });

    if (s.slice(d, d + 2) === '$$') {
      const e = s.indexOf('$$', d + 2);
      if (e === -1) { out.push({ t: 'txt', v: s.slice(d) }); i = s.length; }
      else {
        const tok = s.slice(d, e + 2);
        // block-display only when this token IS the entire (trimmed) line
        const isBlock = s.trim() === tok.trim();
        out.push({ t: 'math', v: tok, block: isBlock });
        i = e + 2;
      }
    } else {
      const e = s.indexOf('$', d + 1);
      if (e === -1) { out.push({ t: 'txt', v: s.slice(d) }); i = s.length; }
      else {
        out.push({ t: 'math', v: s.slice(d, e + 1), block: false });
        i = e + 1;
      }
    }
  }
  return out.filter(x => x.v);
}

// ─── Line classifier ─────────────────────────────────────────────────────────
function lineKind(s) {
  if (!s || !s.trim()) return 'empty';
  const t = s.trim();
  // Whole line is a single $$…$$ block
  if (t.startsWith('$$') && t.endsWith('$$') && t.length > 4) {
    if (!t.slice(2, -2).includes('$$')) return 'mathblock';
  }
  if (t.includes('$')) return 'mixed';
  return 'text';
}

// ─── Mixed line (text + inline math) ─────────────────────────────────────────
const MixedLine = ({ raw }) => {
  const segs = useMemo(() => parseSegments(raw.trim()), [raw]);
  return (
    <div style={css.mixedLine}>
      {segs.map((seg, i) =>
        seg.t === 'math'
          ? <Katex key={i} src={seg.v} block={seg.block} />
          : <span key={i}>{seg.v}</span>
      )}
    </div>
  );
};

// ─── Single line renderer ────────────────────────────────────────────────────
const Line = ({ raw }) => {
  const kind = lineKind(raw);
  if (kind === 'empty') return null;
  if (kind === 'mathblock') return (
    <div style={css.mathBlock}>
      <Katex src={raw.trim()} block={true} />
    </div>
  );
  if (kind === 'mixed') return <MixedLine raw={raw} />;
  return <div style={css.textLine}>{raw.trim()}</div>;
};

// ─── Cursor blink ─────────────────────────────────────────────────────────────
const Cursor = () => (
  <span style={{
    display: 'inline-block', width: 2, height: '1em',
    background: '#7c6af7', marginLeft: 3, verticalAlign: 'text-bottom',
    animation: 'blink 1s step-end infinite',
  }} />
);

// ─── Status pill ──────────────────────────────────────────────────────────────
const Pill = ({ status }) => {
  const M = {
    THINKING: ['#f59e0b', '#2a1f0a', '◐ THINKING'],
    WRITING:  ['#7c6af7', '#160d2e', '✎ WRITING'],
    READY:    ['#22d3ee', '#0a1f2e', '✓ READY'],
    IDLE:     ['#4b5563', '#111',    '○ IDLE'],
  };
  const [color, bg, label] = M[status] || M.IDLE;
  return (
    <span style={{
      background: bg, color, border: `1px solid ${color}50`,
      padding: '3px 12px', borderRadius: 20,
      fontSize: 11, fontFamily: "'Space Mono',monospace", letterSpacing: '0.08em',
    }}>
      {label}
    </span>
  );
};

// ─── Step card ────────────────────────────────────────────────────────────────
const Step = ({ step, active }) => (
  <div style={{ ...css.card, ...(active ? css.cardActive : css.cardDone) }}>
    <div style={{
      ...css.cardHead,
      background: active ? '#13112a' : '#0a120e',
      borderBottom: `1px solid ${active ? '#2a1a5a' : '#0d2016'}`,
    }}>
      <span style={{
        ...css.num,
        background: active ? '#7c6af720' : '#22c55e15',
        border: `1px solid ${active ? '#7c6af760' : '#22c55e40'}`,
        color: active ? '#a78bfa' : '#4ade80',
      }}>
        {step.step}
      </span>
      <span style={{ ...css.label, color: active ? '#c4b5fd' : '#86efac' }}>
        {step.label}
      </span>
      <span style={{ marginLeft: 'auto' }}>
        {active ? <Cursor /> : <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>}
      </span>
    </div>
    <div style={css.lines}>
      {(step.lines || []).map((l, i) => <Line key={i} raw={l} />)}
    </div>
  </div>
);

// ─── Whiteboard ───────────────────────────────────────────────────────────────
export default function Whiteboard({ stepsJson, onExplain, isAiSpeaking }) {
  const [done,    setDone]    = useState([]);
  const [current, setCurrent] = useState(null);
  const [status,  setStatus]  = useState('IDLE');
  const scrollEl     = useRef(null);
  const abort        = useRef(null);
  const userScrolled = useRef(false);   // true once user scrolls up
  const prevStepCount = useRef(0);

  // Only auto-scroll when a NEW step is added AND user hasn't scrolled up
  useEffect(() => {
    const el = scrollEl.current;
    if (!el) return;
    const totalSteps = done.length + (current ? 1 : 0);
    if (totalSteps > prevStepCount.current) {
      prevStepCount.current = totalSteps;
      if (!userScrolled.current) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [done, current]);

  // Reset userScrolled when a new question comes in (stepsJson changes)
  useEffect(() => {
    userScrolled.current = false;
    prevStepCount.current = 0;
  }, [stepsJson]);

  // Detect when user manually scrolls up
  const handleScroll = useCallback(() => {
    const el = scrollEl.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    // If user scrolled more than 80px from bottom, stop auto-scroll
    userScrolled.current = distFromBottom > 80;
  }, []);

  useEffect(() => {
    if (!stepsJson) { setDone([]); setCurrent(null); setStatus('IDLE'); return; }
    let steps;
    try { steps = JSON.parse(stepsJson); } catch { return; }
    if (!Array.isArray(steps) || !steps.length) return;

    if (abort.current) abort.current.abort();
    const ctrl = new AbortController();
    abort.current = ctrl;

    setDone([]); setCurrent(null); setStatus('WRITING');

    (async () => {
      try {
        for (const step of steps) {
          if (ctrl.signal.aborted) return;
          setCurrent(step);
          await delay(500 + (step.lines?.length || 1) * 100, ctrl.signal);
          if (ctrl.signal.aborted) return;
          setDone(p => [...p, step]);
          setCurrent(null);
          await delay(150, ctrl.signal);
        }
        setStatus('READY');
      } catch { setStatus('IDLE'); }
    })();
    return () => ctrl.abort();
  }, [stepsJson]);

  const explain = useCallback(() => {
    if (onExplain && done.length) onExplain(done);
  }, [onExplain, done]);

  return (
    <div style={css.root}>
      {/* Header */}
      <div style={css.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, color: '#7c6af7' }}>✎</span>
          <span style={css.title}>WHITEBOARD</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pill status={status} />
          {status === 'READY' && (
            <button onClick={explain} disabled={isAiSpeaking} style={{
              ...css.btn,
              opacity: isAiSpeaking ? 0.4 : 1,
              cursor: isAiSpeaking ? 'not-allowed' : 'pointer',
            }}>
              {isAiSpeaking ? '🔊 Speaking…' : '▶ Re-explain'}
            </button>
          )}
        </div>
      </div>

      {/* Scroll area */}
      <div ref={scrollEl} style={css.scroll} onScroll={handleScroll}>
        {!done.length && !current ? (
          <div style={css.empty}>
            <div style={{ fontSize: 52, color: '#7c6af7', opacity: 0.1 }}>✎</div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 13, color: '#6b6a8a', opacity: 0.5 }}>
              Ask ARIA a question to begin
            </div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: '#6b6a8a', opacity: 0.25 }}>
              e.g. "Differentiate x·sin x" or "Solve x² + 5x + 6 = 0"
            </div>
          </div>
        ) : (
          <div style={css.steps}>
            {done.map(s => <Step key={'d' + s.step} step={s} active={false} />)}
            {current && <Step key={'a' + current.step} step={current} active={true} />}
            {status === 'READY' && (
              <div style={css.banner}>✓ Solution complete — ask a follow-up or click Re-explain</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .kb .katex         { font-size: 1.1em !important; }
        .kb .katex-display { margin: 0 !important; }
      `}</style>
    </div>
  );
}

function delay(ms, signal) {
  return new Promise((res, rej) => {
    const t = setTimeout(res, ms);
    signal.addEventListener('abort', () => { clearTimeout(t); rej(new Error('abort')); });
  });
}

const css = {
  // Root: full height flex column — minHeight:0 is THE scroll fix
  root: {
    display: 'flex', flexDirection: 'column',
    height: '100%', minHeight: 0,
    background: '#0d0d16', borderRight: '1px solid #1e1e2e',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 18px', borderBottom: '1px solid #1e1e2e',
    background: '#0a0a12', flexShrink: 0,
  },
  title: {
    fontFamily: "'Space Mono',monospace", fontSize: 12,
    color: '#6b6a8a', letterSpacing: '0.12em',
  },
  btn: {
    background: '#1a0d35', color: '#a78bfa',
    border: '1px solid #7c6af750', borderRadius: 6,
    padding: '4px 14px', fontSize: 12,
    fontFamily: "'Space Mono',monospace", outline: 'none',
  },

  // THE scroll fix: flex:1 + minHeight:0 + overflowY:auto
  scroll: {
    flex: 1, minHeight: 0,
    overflowY: 'auto', overflowX: 'hidden',
    scrollbarWidth: 'thin', scrollbarColor: '#2a2a3a #0d0d16',
  },

  // Inner content wrapper with padding and gap
  steps: {
    display: 'flex', flexDirection: 'column', gap: 14,
    padding: '20px 18px 60px',
  },

  empty: {
    height: '100%', minHeight: 300,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', gap: 10,
  },

  card: { borderRadius: 10, overflow: 'hidden', flexShrink: 0, animation: 'slideIn 0.3s ease' },
  cardActive: { border: '1px solid #7c6af760', background: '#0f0a20', boxShadow: '0 0 28px #7c6af718' },
  cardDone:   { border: '1px solid #22c55e20', background: '#0a100d' },
  cardHead:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px' },
  num: {
    width: 28, height: 28, borderRadius: '50%', fontSize: 12, fontWeight: 700,
    fontFamily: "'Space Mono',monospace",
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  label: { fontSize: 13, fontWeight: 600, flex: 1 },
  lines: { padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 },

  mathBlock: {
    padding: '14px 16px', background: '#150d30', borderRadius: 8,
    border: '1px solid #3d2a7020', overflowX: 'auto', textAlign: 'center',
  },
  mixedLine: { padding: '4px 0', color: '#b8b4d8', fontSize: 14, lineHeight: 1.9 },
  textLine:  { padding: '2px 0', color: '#b0adcc', fontSize: 14, lineHeight: 1.8 },
  banner: {
    textAlign: 'center', padding: '10px 0', color: '#22d3ee',
    fontSize: 11, fontFamily: "'Space Mono',monospace", opacity: 0.45,
  },
};