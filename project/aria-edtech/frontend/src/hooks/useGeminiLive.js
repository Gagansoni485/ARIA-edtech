// src/hooks/useGeminiLive.js
import { useState, useRef, useEffect, useCallback } from 'react';
import { ConnectionState } from '../types';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL    = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPT = `You are ARIA, a brilliant math and physics teacher. You solve problems exactly and explain with genuine insight.

Respond with ONLY valid JSON. No text before or after. No markdown. No code fences.

{"speech":"...","steps":[{"step":1,"label":"...","lines":["...","$$...$$"]}]}

═══ LANGUAGE ═══
STRICT RULE: Match the language the user writes in. Nothing else matters.
- User writes in English → respond in English. Even if the topic is Indian, Hindi, or about Indian people.
- User writes in Devanagari script (हिंदी) → respond in Hindi.
- User writes in Hinglish (Roman letters but Hindi words like "mujhe", "batao", "samjhao", "kya hai", "toh") → respond in Hindi.
- NEVER choose Hindi just because the topic sounds Indian. Language of response = language of input.
Hindi: conversational — "तो देखो..." NOT formal "प्रथम चरण में..."
Math inside $$...$$ is always LaTeX regardless of language.

═══ SPEECH ═══
Natural, warm, teacher voice. No LaTeX, no $ signs.
Explain WHY not just WHAT. Give intuition. Mention the key insight.
For numerical problems: mention the method, the numbers, the result conversationally.

═══ STEPS — NUMERICAL PROBLEMS ═══
Show ALL arithmetic clearly. Never skip steps. Label each step with what you're doing.
Types and how to handle them:

ALGEBRA (solve equation):
- Write the equation
- Isolate variable step by step, showing each operation
- Show intermediate values
- Box the final answer

CALCULUS (integrate/differentiate):
- State the rule being used
- Apply it showing each term
- Simplify step by step
- Box result

PHYSICS (word problem):
- Write the formula
- Substitute known values with units
- Calculate step by step
- State the answer with units

ARITHMETIC/NUMBER:
- Show the setup
- Show working with actual numbers
- Show each calculation
- Box the answer

═══ LaTeX — CRITICAL ═══
ALWAYS backslash before commands:
\\frac{a}{b}  \\cdot  \\boxed{x}  \\sqrt{x}
\\sin  \\cos  \\tan  \\ln  \\log  \\int  \\sum
\\times  \\pm  \\infty  \\approx  \\leq  \\geq

Text explanations: plain text, NO $$ wrapping
Math expressions: ALWAYS inside $$...$$

CORRECT: $$\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$
WRONG:   $$frac{-b pm sqrt{b^2 - 4ac}}{2a}$$

═══ EXAMPLES ═══

Quadratic (solve x²+5x+6=0):
{"speech":"Great question! This is a quadratic equation and we can solve it by factoring. We need two numbers that multiply to six and add to five — that's two and three. So x is either negative two or negative three!","steps":[{"step":1,"label":"Write the Equation","lines":["$$x^2 + 5x + 6 = 0$$"]},{"step":2,"label":"Factor the Quadratic","lines":["Find two numbers that multiply to 6 and add to 5","Those numbers are 2 and 3","$$(x + 2)(x + 3) = 0$$"]},{"step":3,"label":"Apply Zero Product Property","lines":["Either $$x + 2 = 0$$ or $$x + 3 = 0$$","$$x = -2 \\quad \\text{or} \\quad x = -3$$"]},{"step":4,"label":"Final Answer","lines":["$$\\boxed{x = -2 \\text{ or } x = -3}$$"]}]}

Integration (∫x²dx from 0 to 3):
{"speech":"This is a definite integral — we're finding the area under x squared from zero to three. We use the Power Rule for integration, which adds one to the exponent and divides by the new power. Plugging in the limits gives us nine!","steps":[{"step":1,"label":"Apply Power Rule for Integration","lines":["$$\\int x^2\\,dx = \\frac{x^3}{3} + C$$","Power Rule: add 1 to exponent, divide by new power"]},{"step":2,"label":"Evaluate at Limits","lines":["$$\\int_0^3 x^2\\,dx = \\left[\\frac{x^3}{3}\\right]_0^3$$","At $$x=3$$: $$\\frac{3^3}{3} = \\frac{27}{3} = 9$$","At $$x=0$$: $$\\frac{0^3}{3} = 0$$"]},{"step":3,"label":"Final Answer","lines":["$$9 - 0 = \\boxed{9}$$"]}]}

Physics (F=ma, m=5kg, a=3m/s²):
{"speech":"Newton's second law tells us force equals mass times acceleration. With five kilograms and three meters per second squared, we just multiply to get fifteen Newtons!","steps":[{"step":1,"label":"Write Newton's Second Law","lines":["$$F = m \\cdot a$$"]},{"step":2,"label":"Substitute Values","lines":["$$m = 5\\text{ kg}, \\quad a = 3\\text{ m/s}^2$$","$$F = 5 \\cdot 3$$"]},{"step":3,"label":"Calculate","lines":["$$F = 15\\text{ N}$$","$$\\boxed{F = 15 \\text{ N}}$$"]}]}

Hindi example (2x+3=11 हल करो):
{"speech":"बहुत अच्छा! तो देखो, यह एक simple linear equation है। हमें x की value निकालनी है। बस 3 दोनों तरफ से घटाओ, फिर 2 से भाग दो। x बराबर 4 आता है!","steps":[{"step":1,"label":"समीकरण लिखो","lines":["$$2x + 3 = 11$$"]},{"step":2,"label":"3 दोनों तरफ से घटाओ","lines":["$$2x + 3 - 3 = 11 - 3$$","$$2x = 8$$"]},{"step":3,"label":"2 से भाग दो","lines":["$$\\frac{2x}{2} = \\frac{8}{2}$$","$$x = 4$$"]},{"step":4,"label":"उत्तर","lines":["$$\\boxed{x = 4}$$"]}]}`;

// ── Explanation prompt ─────────────────────────────────────────────────────
const makeExplainPrompt = (steps, lang, focusStep = null) => {
  const isHindi = lang === 'hi';

  const stepText = steps.map(s => {
    const lines = (s.lines || []).map((l, i) => `  [${i+1}] ${l}`).join('\n');
    return `Step ${s.step} (${s.label}):\n${lines}`;
  }).join('\n\n');

  const focusRule = focusStep !== null
    ? `The student wants to understand Step ${focusStep} most deeply. Give it the richest explanation. Still cover the other steps briefly so the full picture is clear.`
    : `Cover every step. Do not skip any.`;

  if (isHindi) {
    return `तुम ARIA हो — एक बहुत अच्छी math teacher। तुम्हें एक whiteboard solution को verbally explain करना है।

${focusRule}

सख्त नियम: सिर्फ whiteboard पर जो है उसी को explain करो। कोई नया example मत दो। जो steps दिए हैं उनसे बाहर मत जाओ। final answer के बाद कुछ मत बोलो।

बोलने का तरीका:
- बिल्कुल दोस्त की तरह बोलो — जैसे किसी को personally समझा रहे हो
- कोई "Step 1:", "Step 2:" मत बोलो — naturally flow करो
- पहले बताओ यह कैसा problem है और क्यों यह method use करेंगे
- फिर हर step का concept बताओ — क्या हो रहा है और क्यों हो रहा है
- कोई भी math symbol मत बोलो — "x ka square", "ऊपर-नीचे वाला form", "बराबर" बोलो
- एक बड़ा flowing paragraph लिखो — अलग-अलग lines नहीं

EXAMPLE — यह style चाहिए (x sin x का differentiation):
"तो देखो, यहाँ हमारे पास x और sine x दोनों multiply हो रहे हैं। जब भी दो functions आपस में multiply हों, तो हम सीधे differentiate नहीं कर सकते — इसके लिए एक special rule होता है जिसे Product Rule कहते हैं। Product Rule कहता है कि पहले function को differentiate करो और दूसरे को as-is रखो, फिर उसमें add करो पहले function को as-is और दूसरे का differentiation। तो यहाँ पहला function x है जिसका derivative बस 1 होता है क्योंकि x एक simple linear function है। दूसरा function sine x है जिसका derivative cosine x होता है। अब इन्हें formula में डालते हैं: 1 गुना sine x, plus x गुना cosine x। simplify होने पर मिलता है sine x plus x cosine x। यही हमारा final answer है।"

अब इसी style में इन steps को explain करो:
${stepText}

Respond with ONLY valid JSON: {"speech":"...","steps":[]}
"steps" must be []. सारी explanation "speech" में।`;
  }

  return `You are ARIA, an excellent math and physics teacher. You need to verbally explain a whiteboard solution to a student.

${focusRule}

STRICT SCOPE RULE: Explain ONLY what is on the whiteboard. Do not introduce new examples or analogies. Stay within the given steps. Nothing after the final answer.

HOW TO SPEAK:
- Talk like a real teacher having a conversation — warm, natural, flowing
- NEVER say "Step 1", "Step 2", "Part 1", "Part 2" — these sound robotic when spoken aloud
- Instead use natural transitions: "So first...", "Now the key thing here is...", "Because of that, we can now...", "Which gives us...", "And that's why..."
- Start by saying what TYPE of problem this is and WHY this specific method/rule is being used
- For every step: explain what is happening conceptually and WHY this operation is needed
- For any formula: say it in plain English words and explain what each part represents
- Connect each step to the next with "because of this, now we can..."
- End by saying what the final answer means — nothing after that

ABSOLUTE RULE: Zero math symbols in speech. Never say $, ^, \\, {, }. Instead:
- Say "x squared" not "x to the power 2"
- Say "the derivative of sine x is cosine x"
- Say "the fraction with a on top and b on the bottom"
- Say "square root of x" / "equals" not "="

EXAMPLE of perfect explanation style (d/dx of x·sin x):
"So what we have here is x multiplied by sine x — two functions being multiplied together. This is important because you cannot just differentiate each function separately when they are multiplied. There is a special rule for exactly this situation called the Product Rule. The Product Rule says: take the derivative of the first function and multiply it by the second function unchanged, then add the first function unchanged multiplied by the derivative of the second. So our first function is x — its derivative is simply 1, because x grows at a perfectly constant rate. Our second function is sine x — its derivative is cosine x. Now we plug both into the rule: 1 times sine x, plus x times cosine x. Since 1 times anything is just that thing, this simplifies to sine x plus x cosine x. And that is our answer."

Write ONE single flowing spoken explanation — no headers, no bullet points, no numbered steps. Just natural teacher speech.

Respond with ONLY valid JSON: {"speech":"...","steps":[]}
"steps" must be []. All explanation goes in "speech".

WHITEBOARD STEPS TO EXPLAIN:
${stepText}`;
};


export const useGeminiLive = () => {
  const [connectionState,  setConnectionState]  = useState(ConnectionState.DISCONNECTED);
  const [stepsJson,        setStepsJson]         = useState('');
  const [userVolumeLevel,  setUserVolumeLevel]   = useState(0);
  const [aiVolumeLevel,    setAiVolumeLevel]     = useState(0);
  const [isAiSpeaking,     setIsAiSpeaking]      = useState(false);
  const [isThinking,       setIsThinking]        = useState(false);
  const [isMicOn,          setIsMicOn]           = useState(true);
  const [inputTranscript,  setInputTranscript]   = useState('');
  const [outputTranscript, setOutputTranscript]  = useState('');

  const historyRef     = useRef([]);
  const recognitionRef = useRef(null);
  const isMicOnRef     = useRef(true);
  const isListeningRef = useRef(false);
  const isSpeakingRef  = useRef(false);
  const isConnectedRef = useRef(false);
  const volIntervalRef = useRef(null);
  const audioCtxRef    = useRef(null);
  const streamRef      = useRef(null);
  const lastStepsRef   = useRef([]);
  const lastLangRef    = useRef('en');
  const speakCancelRef = useRef(false);

  useEffect(() => { isMicOnRef.current = isMicOn; }, [isMicOn]);

  // ── Detect language (Devanagari + Hinglish) ───────────────────────────────
  const detectLang = useCallback((text) => {
    // Check Devanagari script first
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    if (hindiChars > 2) return 'hi';

    // Detect Hinglish — only UNAMBIGUOUS Hindi words in Roman script
    // Removed short/common words like 'the','se','ko','ka','ki','ke','par','ye','wo','main'
    // that appear frequently in normal English sentences and cause false positives
    const hinglishWords = [
      'mujhe','tumhe','aapko',
      'kya','hai','hain',
      'nahi','nhi','kyun','kaise','kab','kahan','kaun',
      'batao','samjhao','dekho','bolo','suno','achha','accha',
      'hota','hoti','hote','karo','karna','karke',
      'mein','yeh','woh','toh',
      'sirf','bahut','bohot','thoda','aur',
    ];
    const lower = text.toLowerCase();
    const words = lower.split(/\s+/);
    const hinglishCount = words.filter(w => hinglishWords.includes(w)).length;
    return hinglishCount >= 2 ? 'hi' : 'en';
  }, []);

  // ── Strip LaTeX from text for TTS ─────────────────────────────────────────
  const stripLatex = useCallback((text) => {
    return text
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      .replace(/\$[^$]*?\$/g, '')
      .replace(/\\[a-zA-Z]+\{[^}]*\}/g, '')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/[{}]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }, []);

  // ── Split text into <=180 char chunks at word boundaries ─────────────────
  // Chrome TTS silently cuts off utterances longer than ~200 chars
  const chunkText = useCallback((text) => {
    if (text.length <= 180) return [text];
    const chunks = [];
    let remaining = text;
    while (remaining.length > 180) {
      let cut = remaining.lastIndexOf(' ', 180);
      if (cut <= 0) cut = 180;
      chunks.push(remaining.slice(0, cut).trim());
      remaining = remaining.slice(cut).trim();
    }
    if (remaining.length > 0) chunks.push(remaining);
    return chunks;
  }, []);

  // ── Speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback((text, onEnd) => {
    const cleanText = stripLatex(text);
    if (!cleanText) { onEnd?.(); return; }

    const lang = lastLangRef.current || 'en';
    const synth = window.speechSynthesis;
    synth.cancel();

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(cleanText);
      utt.volume = 1.0;
      const voices = synth.getVoices();

      if (lang === 'hi') {
        utt.lang  = 'hi-IN';
        utt.rate  = 0.78;
        utt.pitch = 1.0;
        const hiVoice = voices.find(v => v.lang === 'hi-IN')
                     || voices.find(v => v.lang.startsWith('hi'));
        if (hiVoice) utt.voice = hiVoice;
      } else {
        utt.lang  = 'en-US';
        utt.rate  = 0.82;
        utt.pitch = 1.05;
        const enVoice = voices.find(v => v.name.includes('Google') && v.lang === 'en-US')
                     || voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('compact'))
                     || voices.find(v => v.lang.startsWith('en'))
                     || voices[0];
        if (enVoice) utt.voice = enVoice;
      }

      let volTick;
      utt.onstart = () => {
        isSpeakingRef.current = true;
        setIsAiSpeaking(true);
        setOutputTranscript(cleanText);
        volTick = setInterval(() => setAiVolumeLevel(Math.random() * 40 + 20), 80);
      };
      // onend and onerror are SEPARATE — onerror on 'interrupted' must NOT call onEnd
      // because synth.cancel() fires onerror('interrupted') and calling onEnd there
      // would schedule the next chunk even after an interrupt, causing restart loops
      utt.onend = () => {
        isSpeakingRef.current = false;
        clearInterval(volTick);
        setIsAiSpeaking(false);
        setAiVolumeLevel(0);
        setOutputTranscript('');
        onEnd?.();
      };
      utt.onerror = (e) => {
        isSpeakingRef.current = false;
        clearInterval(volTick);
        setIsAiSpeaking(false);
        setAiVolumeLevel(0);
        setOutputTranscript('');
        // Do NOT call onEnd for interruptions — that would restart the chain
        if (e.error !== 'interrupted' && e.error !== 'canceled') onEnd?.();
      };
      synth.speak(utt);
    };

    if (synth.getVoices().length > 0) doSpeak();
    else synth.addEventListener('voiceschanged', () => doSpeak(), { once: true });
  }, [stripLatex]);

  // ── Resume mic ────────────────────────────────────────────────────────────
  const resumeListening = useCallback(() => {
    if (!isMicOnRef.current || !recognitionRef.current || isListeningRef.current) return;
    setTimeout(() => {
      if (!isMicOnRef.current || isListeningRef.current) return;
      try { isListeningRef.current = true; recognitionRef.current.start(); }
      catch (_) { isListeningRef.current = false; }
    }, 300);
  }, []);

  // ── Interrupt speech ──────────────────────────────────────────────────────
  const interruptSpeech = useCallback(() => {
    speakCancelRef.current = true;   // kill any pending paragraph chain
    window.speechSynthesis.cancel();
    isSpeakingRef.current = false;
    setIsAiSpeaking(false);
    setAiVolumeLevel(0);
    setOutputTranscript('');
  }, []);

  // ── Fix LaTeX control chars in parsed string values ───────────────────────
  const fixCtrlChars = useCallback((str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/\x08/g, '\\b')
      .replace(/\x0C/g, '\\f')
      .replace(/\\\[/g, '$$').replace(/\\\]/g, '$$')
      .replace(/\\\(/g, '$').replace(/\\\)/g, '$');
  }, []);

  const fixParsed = useCallback((obj) => {
    if (typeof obj === 'string') return fixCtrlChars(obj);
    if (Array.isArray(obj))      return obj.map(fixParsed);
    if (obj && typeof obj === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(obj)) out[k] = fixParsed(v);
      return out;
    }
    return obj;
  }, [fixCtrlChars]);

  // ── Extract JSON ──────────────────────────────────────────────────────────
  const extractJSON = useCallback((raw) => {
    const attempt = (str) => {
      try {
        const parsed = JSON.parse(str);
        if (parsed && typeof parsed.speech === 'string') return fixParsed(parsed);
      } catch (_) {}
      return null;
    };
    const direct = attempt(raw.trim());
    if (direct) return direct;
    const stripped = raw
      .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
    const fenced = attempt(stripped);
    if (fenced) return fenced;
    const start = raw.indexOf('{');
    const end   = raw.lastIndexOf('}');
    if (start !== -1 && end > start) {
      const slice = attempt(raw.slice(start, end + 1));
      if (slice) return slice;
    }
    return { speech: 'Here is the solution on the whiteboard!', steps: [] };
  }, [fixParsed]);

  // ── Raw Groq call ─────────────────────────────────────────────────────────
  const callGroqRaw = useCallback(async (messages, maxTokens = 3000) => {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error('VITE_GROQ_API_KEY not set');
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.5,
        max_tokens: maxTokens,
        response_format: { type: 'json_object' },
      }),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }, []);

  // ── Main Groq call ────────────────────────────────────────────────────────
  const callGroq = useCallback(async (text) => {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyRef.current,
      { role: 'user', content: text },
    ];
    const raw = await callGroqRaw(messages);
    console.log('[ARIA] Raw:', raw.slice(0, 300));

    const parsed = extractJSON(raw);
    if (typeof parsed.speech !== 'string') parsed.speech = 'Here is the solution!';
    parsed.speech = stripLatex(parsed.speech) || 'Here is the solution!';

    // Store topic + step labels — gives follow-up questions context without LaTeX pollution
    const stepSummary = (parsed.steps || [])
      .map(s => `Step ${s.step}: ${s.label}`)
      .join(', ');
    const assistantSummary = stepSummary
      ? `Explained "${text}" with steps: ${stepSummary}`
      : `Answered: "${text}"`;

    historyRef.current = [
      ...historyRef.current,
      { role: 'user',      content: text },
      { role: 'assistant', content: assistantSummary },
    ].slice(-10);

    return parsed;
  }, [callGroqRaw, extractJSON, stripLatex]);

  // ── Build step speech (fallback) ──────────────────────────────────────────
  const buildStepSpeech = useCallback((introSpeech, steps, lang) => {
    const stepParts = steps.map((s, idx) => {
      const isFirst = idx === 0;
      const isLast  = idx === steps.length - 1;
      const textLines = (s.lines || [])
        .filter(l => !l.trim().startsWith('$$') && l.trim().length > 0)
        .map(l => stripLatex(l));
      if (lang === 'hi') {
        const transition = isFirst ? `पहला step है: ${s.label}.`
          : isLast ? `और अब आखिरी step: ${s.label}.`
          : `अब step ${s.step}: ${s.label}.`;
        return transition + (textLines.length ? ' ' + textLines.join(' ') : '');
      } else {
        const transition = isFirst ? `Let's start — step ${s.step} is ${s.label}.`
          : isLast ? `And finally, step ${s.step}: ${s.label}.`
          : `Step ${s.step}: ${s.label}.`;
        return transition + (textLines.length ? ' ' + textLines.join(' ') : '');
      }
    });
    return introSpeech + '  ' + stepParts.join('  ');
  }, [stripLatex]);

  // ── Speak paragraphs serially, chunked to beat Chrome TTS 200-char limit ──
  const speakParagraphs = useCallback((paragraphs, onDone) => {
    // Strip LaTeX, filter empty, chunk each paragraph into <=180 char pieces
    const chunks = paragraphs
      .map(p => stripLatex(p.trim()))
      .filter(p => p.length > 0)
      .flatMap(p => chunkText(p));

    if (!chunks.length) { onDone?.(); return; }

    speakCancelRef.current = false;

    const speakOne = (idx) => {
      if (speakCancelRef.current || idx >= chunks.length) {
        if (!speakCancelRef.current) onDone?.();
        return;
      }
      speak(chunks[idx], () => {
        setTimeout(() => speakOne(idx + 1), 300);
      });
    };

    speakOne(0);
  }, [speak, stripLatex, chunkText]);

  // ── Re-explain ────────────────────────────────────────────────────────────
  const reExplainSteps = useCallback(async (steps, focusStep = null) => {
    if (!steps?.length || !isConnectedRef.current) return;
    const lang = lastLangRef.current;

    interruptSpeech();
    setIsThinking(true);

    try {
      const prompt = makeExplainPrompt(steps, lang, focusStep);
      const raw = await callGroqRaw([{ role: 'user', content: prompt }], 4000);

      setIsThinking(false);
      const parsed = extractJSON(raw);
      const speech = parsed.speech || '';

      if (speech.trim()) {
        // Split on newlines; speakParagraphs+chunkText handle all length splitting
        let paragraphs = speech.split(/\n\n+/).filter(p => p.trim());
        if (paragraphs.length <= 1) paragraphs = speech.split(/\n/).filter(p => p.trim());
        if (paragraphs.length <= 1) paragraphs = [speech];
        speakParagraphs(paragraphs, resumeListening);
      } else {
        const fallback = buildStepSpeech('Let me walk you through this.', steps, lang);
        speak(fallback, resumeListening);
      }
    } catch (err) {
      console.error('[ARIA] Re-explain failed:', err.message);
      setIsThinking(false);
      const fallback = buildStepSpeech('Let me walk you through the solution.', steps, lang);
      speak(fallback, resumeListening);
    }
  }, [callGroqRaw, extractJSON, speak, speakParagraphs, resumeListening,
      interruptSpeech, buildStepSpeech]);

  // ── Process user message ──────────────────────────────────────────────────
  const processUserMessage = useCallback(async (text) => {
    if (!text?.trim() || !isConnectedRef.current) return;
    console.log('[ARIA] Processing:', text);

    const t = text.trim();
    const stepNumMatch = t.match(/(?:step|चरण)\s*(\d+)/i);

    // Broad explain detection — check BEFORE clearing lastStepsRef
    const isExplainRequest = /^(explain|re.?explain|समझाओ|समझाइए|फिर\s*से|again|once\s*more)/i.test(t);
    if (isExplainRequest && lastStepsRef.current.length > 0) {
      const focusStep = stepNumMatch ? parseInt(stepNumMatch[1]) : null;
      interruptSpeech();
      reExplainSteps(lastStepsRef.current, focusStep);
      return;
    }

    interruptSpeech();

    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const lang = detectLang(text);
    lastLangRef.current = lang;

    setIsThinking(true);
    setInputTranscript(text);
    // Clear AFTER explain check
    setStepsJson('');
    lastStepsRef.current = [];

    try {
      const response = await callGroq(text);
      setIsThinking(false);

      if (response.steps?.length > 0) {
        lastStepsRef.current = response.steps;
        setStepsJson(JSON.stringify(response.steps));
        reExplainSteps(response.steps, null);
      } else {
        speak(response.speech || 'Here is the answer!', resumeListening);
      }
    } catch (err) {
      console.error('[ARIA] Error:', err.message);
      setIsThinking(false);
      speak(
        err.message?.includes('429') ? 'Quota exceeded, please wait a moment.' : 'Sorry, something went wrong. Please try again.',
        resumeListening
      );
    }
  }, [callGroq, speak, resumeListening, interruptSpeech, detectLang, reExplainSteps]);

  // ── sendTextMessage ───────────────────────────────────────────────────────
  const sendTextMessage = useCallback((text) => {
    interruptSpeech();
    processUserMessage(text);
  }, [processUserMessage, interruptSpeech]);

  // ── sendExplainRequest ────────────────────────────────────────────────────
  const sendExplainRequest = useCallback((steps, focusStep = null) => {
    reExplainSteps(steps, focusStep);
  }, [reExplainSteps]);

  // ── toggleMic ─────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const next = !isMicOn;
    setIsMicOn(next);
    isMicOnRef.current = next;
    if (!next) {
      isListeningRef.current = false;
      try { recognitionRef.current?.stop(); } catch (_) {}
      setUserVolumeLevel(0);
    } else {
      resumeListening();
    }
  }, [isMicOn, resumeListening]);

  // ── Connect ───────────────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    if (isConnectedRef.current || connectionState === ConnectionState.CONNECTING) return;
    setConnectionState(ConnectionState.CONNECTING);
    isConnectedRef.current = false;

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!apiKey || apiKey.trim() === '' || apiKey === 'your_groq_key_here') {
        throw new Error('VITE_GROQ_API_KEY not set in .env');
      }

      historyRef.current = [];
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) throw new Error('SpeechRecognition not supported — please use Chrome.');

      const recognition          = new SR();
      recognition.continuous     = true;
      recognition.interimResults = true;
      recognition.lang           = lastLangRef.current === 'hi' ? 'hi-IN' : 'en-US';
      recognitionRef.current     = recognition;

      recognition.onresult = (e) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript;
          else interim += e.results[i][0].transcript;
        }

        // INSTANT stop: kill TTS the moment any speech is detected (interim)
        if (interim && isSpeakingRef.current) {
          speakCancelRef.current = true;
          window.speechSynthesis.cancel();
          isSpeakingRef.current = false;
          setIsAiSpeaking(false);
          setAiVolumeLevel(0);
          setOutputTranscript('');
        }

        if (final) {
          speakCancelRef.current = true;
          window.speechSynthesis.cancel();
          isSpeakingRef.current = false;
          setIsAiSpeaking(false);
          setAiVolumeLevel(0);
          setOutputTranscript('');
          processUserMessage(final.trim());
          return;
        }
        if (!isSpeakingRef.current && interim) setInputTranscript(interim);
      };

      recognition.onstart = () => { isListeningRef.current = true; };
      recognition.onend   = () => {
        isListeningRef.current = false;
        if (isConnectedRef.current && isMicOnRef.current) {
          setTimeout(() => {
            if (isConnectedRef.current && isMicOnRef.current && !isListeningRef.current) {
              try { recognition.start(); isListeningRef.current = true; } catch (_) {}
            }
          }, 200);
        }
      };
      recognition.onerror = (e) => {
        isListeningRef.current = false;
        if (e.error !== 'no-speech' && e.error !== 'aborted') console.warn('[ARIA] Mic error:', e.error);
      };

      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = s;
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        ctx.createMediaStreamSource(s).connect(analyser);
        volIntervalRef.current = setInterval(() => {
          if (!isMicOnRef.current) { setUserVolumeLevel(0); return; }
          const d = new Uint8Array(analyser.frequencyBinCount);
          analyser.getByteFrequencyData(d);
          setUserVolumeLevel(d.reduce((a, b) => a + b, 0) / d.length);
        }, 80);
      } catch (_) { console.warn('[ARIA] Mic visualizer unavailable'); }

      isConnectedRef.current = true;
      setConnectionState(ConnectionState.CONNECTED);

      setTimeout(() => speak(
        "Hello! what's your question?",
        () => {
          try { recognition.start(); isListeningRef.current = true; } catch (_) {}
        }
      ), 500);

    } catch (err) {
      console.error('[ARIA] Connect failed:', err.message);
      isConnectedRef.current = false;
      setConnectionState(ConnectionState.ERROR);
      setTimeout(() => setConnectionState(ConnectionState.DISCONNECTED), 3000);
    }
  }, [connectionState, speak, processUserMessage]);

  // ── Disconnect ────────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    isConnectedRef.current  = false;
    speakCancelRef.current  = true;
    window.speechSynthesis?.cancel();
    isSpeakingRef.current  = false;
    isListeningRef.current = false;
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
    historyRef.current     = [];
    clearInterval(volIntervalRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    try { if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close(); } catch (_) {}
    setConnectionState(ConnectionState.DISCONNECTED);
    setIsAiSpeaking(false); setIsThinking(false);
    setUserVolumeLevel(0);  setAiVolumeLevel(0);
    setInputTranscript(''); setOutputTranscript('');
    setStepsJson('');
    lastStepsRef.current = [];
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  return {
    connect, disconnect, sendTextMessage, sendExplainRequest,
    connectionState, stepsJson,
    userVolumeLevel, aiVolumeLevel,
    isAiSpeaking, isThinking,
    isMicOn, toggleMic,
    inputTranscript, outputTranscript,
  };
};