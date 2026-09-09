'use client';

import { useEffect, useState } from 'react';

const PHRASES = [
  '100% Organic & Halal Certified',
  'Visible Hair Growth in 30 Days',
  'Cruelty-Free & Paraben-Free',
  'Dermatologically Tested',
];

const TYPE_SPEED_MS = 45;
const ERASE_SPEED_MS = 25;
const HOLD_MS = 1600;
const PAUSE_BEFORE_NEXT_MS = 350;

export default function Typewriter() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase] = useState<'typing' | 'holding' | 'erasing' | 'pausing'>(
    'typing'
  );

  // Reserve space for the longest phrase so nothing shifts as text
  // types/erases (zero layout shift requirement).
  const longest = PHRASES.reduce((a, b) => (b.length > a.length ? b : a), '');

  useEffect(() => {
    const currentPhrase = PHRASES[phraseIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === 'typing') {
      if (displayed.length < currentPhrase.length) {
        timeout = setTimeout(() => {
          setDisplayed(currentPhrase.slice(0, displayed.length + 1));
        }, TYPE_SPEED_MS);
      } else {
        timeout = setTimeout(() => setPhase('holding'), 10);
      }
    } else if (phase === 'holding') {
      timeout = setTimeout(() => setPhase('erasing'), HOLD_MS);
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(currentPhrase.slice(0, displayed.length - 1));
        }, ERASE_SPEED_MS);
      } else {
        timeout = setTimeout(() => setPhase('pausing'), 10);
      }
    } else if (phase === 'pausing') {
      timeout = setTimeout(() => {
        setPhraseIndex((i) => (i + 1) % PHRASES.length);
        setPhase('typing');
      }, PAUSE_BEFORE_NEXT_MS);
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, phraseIndex]);

  return (
    <span className="relative inline-grid">
      {/* invisible sizer reserves max width/height so layout never shifts */}
      <span className="col-start-1 row-start-1 invisible" aria-hidden="true">
        {longest}|
      </span>
      <span
        className="col-start-1 row-start-1 font-semibold"
        style={{ color: '#2B9611' }}
      >
        {displayed}
        <span className="animate-blink" style={{ color: '#2B9611' }}>
          |
        </span>
      </span>
    </span>
  );
}
