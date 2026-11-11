import { useEffect, useState } from 'react';

// The new-report alert sounds: one for each kind of report, so staff can tell
// what came in without looking.
//   emergency   a siren: two tones taking turns, three times (urgent)
//   assistance  a rising three-note chime (calm)
//   pettyCrime  two pairs of short low beeps ("knock-knock, knock-knock")
// Made with the Web Audio API, so there are no sound files to load.
//
// Browsers only let a page play sound after someone has clicked or typed on
// it. The first click or key press on the page switches sound on; until then
// audioState() is 'blocked' and the page offers an "Enable sound" button.

export const SOUND_KINDS = ['emergency', 'assistance', 'pettyCrime'];

const TONES = {
  emergency: { wave: 'triangle', gain: 0.2, notes: [[880, 0, 0.17], [660, 0.18, 0.17], [880, 0.36, 0.17], [660, 0.54, 0.17], [880, 0.72, 0.17], [660, 0.9, 0.22]] },
  assistance: { wave: 'sine', gain: 0.2, notes: [[523, 0, 0.5], [659, 0.16, 0.5], [784, 0.32, 0.7]] },
  pettyCrime: { wave: 'square', gain: 0.07, notes: [[392, 0, 0.09], [392, 0.14, 0.09], [330, 0.44, 0.09], [330, 0.58, 0.09]] }
};
// How long each sound lasts, so several play one after another.
const LENGTH = { emergency: 1.25, assistance: 1.1, pettyCrime: 0.8 };

let ctx = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(audioState()));

const getContext = () => {
  if (ctx) return ctx;
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  try {
    ctx = new Ctx();
    if (ctx.addEventListener) ctx.addEventListener('statechange', notify);
  } catch {
    ctx = null;
  }
  return ctx;
};

// 'ready', 'blocked' (waiting for a click) or 'unsupported'.
export const audioState = () => {
  const c = getContext();
  if (!c) return 'unsupported';
  return c.state === 'running' ? 'ready' : 'blocked';
};

// Called from a click or key press: allowed to switch sound on.
export const unlockAudio = async () => {
  const c = getContext();
  if (!c) return false;
  if (c.state !== 'running') {
    try { await c.resume(); } catch { /* still blocked */ }
  }
  notify();
  return c.state === 'running';
};

// The first click or key press anywhere on the page switches sound on.
let gestureHooked = false;
export const unlockOnFirstGesture = () => {
  if (gestureHooked || typeof document === 'undefined') return;
  gestureHooked = true;
  const onGesture = () => {
    unlockAudio().then((ok) => {
      if (!ok) return;
      document.removeEventListener('pointerdown', onGesture, true);
      document.removeEventListener('keydown', onGesture, true);
    });
  };
  document.addEventListener('pointerdown', onGesture, true);
  document.addEventListener('keydown', onGesture, true);
};

const schedule = (c, kind, start) => {
  const tone = TONES[kind] || TONES.emergency;
  tone.notes.forEach(([freq, at, len]) => {
    const t = start + at;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = tone.wave;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(tone.gain, t + 0.015);
    gain.gain.setValueAtTime(tone.gain, t + Math.max(0.02, len - 0.06));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + len);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + len + 0.05);
  });
};

// Plays the sound of each kind given, one after another (each kind once).
// Returns false when the browser is still blocking sound.
export const playReportSounds = (kinds) => {
  const c = getContext();
  if (!c) return false;
  if (c.state !== 'running') {
    c.resume().catch(() => {});
    notify();
    if (c.state !== 'running') return false;
  }
  let start = c.currentTime + 0.05;
  [...new Set(kinds)].filter((k) => TONES[k]).forEach((kind) => {
    schedule(c, kind, start);
    start += LENGTH[kind] + 0.25;
  });
  return true;
};

export const playReportSound = (kind) => playReportSounds([kind]);

// The current audio state, kept up to date (for an "Enable sound" button).
export function useAudioState() {
  const [state, setState] = useState(audioState);
  useEffect(() => {
    listeners.add(setState);
    setState(audioState());
    return () => listeners.delete(setState);
  }, []);
  return state;
}
