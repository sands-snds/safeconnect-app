// A stand-in for the browser's AudioContext that records the notes played.
class FakeAudioContext {
  constructor() {
    FakeAudioContext.last = this;
    this.state = FakeAudioContext.startState;
    this.currentTime = 0;
    this.notes = [];
    this.destination = {};
  }
  addEventListener() {}
  resume() {
    if (FakeAudioContext.allowResume) this.state = 'running';
    return Promise.resolve();
  }
  createOscillator() {
    const osc = { type: '', frequency: { value: 0 }, connect: (g) => g, start: (t) => { this.notes.push({ wave: osc.type, freq: osc.frequency.value, at: t }); }, stop() {} };
    return osc;
  }
  createGain() {
    const ramp = () => {};
    return { gain: { setValueAtTime: ramp, linearRampToValueAtTime: ramp, exponentialRampToValueAtTime: ramp }, connect: (d) => d };
  }
}

const load = ({ state = 'running', allowResume = true } = {}) => {
  FakeAudioContext.startState = state;
  FakeAudioContext.allowResume = allowResume;
  window.AudioContext = FakeAudioContext;
  let mod;
  jest.isolateModules(() => { mod = require('./reportSounds'); });
  return mod;
};

afterEach(() => { delete window.AudioContext; });

test('each kind of report has a sound that is clearly different', () => {
  const { playReportSound } = load();
  const heard = {};
  for (const kind of ['emergency', 'assistance', 'pettyCrime']) {
    FakeAudioContext.last && (FakeAudioContext.last.notes = []);
    expect(playReportSound(kind)).toBe(true);
    heard[kind] = FakeAudioContext.last.notes.map((n) => `${n.wave}:${n.freq}`).join(' ');
  }
  expect(new Set(Object.values(heard)).size).toBe(3);
  expect(heard.emergency).toMatch(/880.*660.*880/); // a siren: two tones taking turns
});

test('several reports at once: each kind plays once, one after another', () => {
  const { playReportSounds } = load();
  playReportSounds(['emergency', 'emergency', 'pettyCrime']);
  const notes = FakeAudioContext.last.notes;
  const siren = notes.filter((n) => n.wave === 'triangle');
  const beeps = notes.filter((n) => n.wave === 'square');
  expect(siren).toHaveLength(6); // not twice
  expect(beeps).toHaveLength(4);
  expect(Math.min(...beeps.map((n) => n.at))).toBeGreaterThan(Math.max(...siren.map((n) => n.at)));
});

test('while the browser blocks sound nothing plays, and the state says so', () => {
  const { playReportSound, audioState } = load({ state: 'suspended', allowResume: false });
  expect(audioState()).toBe('blocked');
  expect(playReportSound('emergency')).toBe(false);
  expect(FakeAudioContext.last.notes).toHaveLength(0);
});

test('a click can switch sound on (unlockAudio)', async () => {
  const { unlockAudio, audioState, playReportSound } = load({ state: 'suspended', allowResume: true });
  expect(audioState()).toBe('blocked');
  await expect(unlockAudio()).resolves.toBe(true);
  expect(audioState()).toBe('ready');
  expect(playReportSound('assistance')).toBe(true);
});

test('without Web Audio support it says so instead of failing', () => {
  delete window.AudioContext;
  let mod;
  jest.isolateModules(() => { mod = require('./reportSounds'); });
  expect(mod.audioState()).toBe('unsupported');
  expect(mod.playReportSound('emergency')).toBe(false);
});
