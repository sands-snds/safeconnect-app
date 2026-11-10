// Checks the text residents type into a report (descriptions, names,
// addresses…) for three problems, in this order:
//   offensive   - English or Filipino profanity and insults, also when
//                 disguised (f*ck, p u t a, sh1t, fuuuck, pakyu)
//   spam        - keyboard runs (asdfgh, qwerty, 123456), one letter held
//                 down (aaaaa), a chunk repeated (hahaha, asdasdasd), the
//                 same word four or more times in a row
//   meaningless - (descriptions only) no letters at all, or mostly
//                 letter-salad words
// Short texts, numbers, capitals and everyday Filipino words are fine, and a
// bad word only counts as a whole word, never inside another word.
//
// The backend runs the same rules (backend/utils/textCheck.js); keep the two
// files the same.

// kind: 'description' (all three checks), 'short' (names, streets,
// landmarks…: offensive + spam) or 'number' (house / lot / block number).
export const TEXT_KINDS = ['description', 'short', 'number'];

// Profanity and insults, written plainly. Matching undoes doubled letters
// and number/symbol stand-ins, so those variants needn't be listed.
const OFFENSIVE_WORDS = [
  // English
  'fuck', 'fck', 'fuk', 'fuq', 'fak', 'motherfucker', 'shit', 'shitty', 'bullshit', 'bitch', 'bitchy',
  'biatch', 'asshole', 'bastard', 'cunt', 'dickhead', 'pussy', 'whore', 'slut', 'nigger', 'nigga',
  'faggot', 'fag', 'retard', 'dumbass', 'jackass', 'wtf', 'stfu', 'gtfo',
  // Filipino / Tagalog
  'putangina', 'putanginamo', 'putang', 'puta', 'pota', 'potah', 'putragis', 'tangina', 'tanginamo',
  'taena', 'tngina', 'kingina', 'kinginamo', 'bwakanangina', 'gago', 'gaga', 'gagu', 'ulol', 'ulul',
  'olol', 'tarantado', 'tarantada', 'tanga', 'bobo', 'boba', 'inutil', 'punyeta', 'punyemas', 'pakyu',
  'pakshet', 'pakingshet', 'letse', 'hinayupak', 'kupal', 'pokpok', 'puki', 'puke', 'pekpek', 'titi',
  'tite', 'burat', 'bayag', 'kantot', 'kantutan', 'iyot', 'jakol', 'chupa', 'tamod', 'libog',
  'malibog', 'bilat', 'siraulo', 'engot', 'shet', 'syet',
  // Bisaya
  'yawa', 'piste', 'pisti'
];
// Matched only as the whole word (they start ordinary words or names).
const EXACT_ONLY = ['dick', 'fag', 'tite', 'titi', 'shet'];
// Two-word insults.
const OFFENSIVE_PHRASES = ['tang ina', 'putang ina', 'puta ng ina', 'anak ng puta', 'hayop ka', 'sira ulo', 'pak yu', 'fuck you'];
// Endings that keep a word the same insult (gagong, bobong, fucking, shits).
// No "y": "tanga" + "y" is "tangay" (carried away, as by a flood).
const SUFFIXES = ['', 's', 'es', 'ed', 'er', 'ers', 'ing', 'in', 'ng', 'g', 'mo', 'ka', 'han', 'an', 'head', 'face'];

const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i' };

// Doubled letters merged ("fuuuck" → "fuck"); lower case, accents off.
const squeeze = (word) => word.replace(/(.)\1+/g, '$1');
const plain = (text) => String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const ROOTS = OFFENSIVE_WORDS.map(squeeze);
const EXACT_ONLY_SQUEEZED = EXACT_ONLY.map(squeeze);
const EXACT = new Set([...EXACT_ONLY_SQUEEZED, ...ROOTS]);
const SUFFIX_ROOTS = ROOTS.filter((r) => r.length >= 4 && !EXACT_ONLY_SQUEEZED.includes(r));
const PHRASES = OFFENSIVE_PHRASES.map((p) => p.split(' ').map(squeeze).join(' '));

// Words for the offensive check: stand-ins undone, "*" kept as a wildcard,
// and spelled-out letters joined (p u t a, f-u-c-k → puta, fuck).
const offensiveTokens = (text) => {
  const mapped = plain(text).replace(/ph/g, 'f').replace(/[0134578@$!|]/g, (c) => LEET[c] || c);
  const tokens = [];
  let letters = '';
  mapped.split(/[^a-z*]+/).filter(Boolean).forEach((w) => {
    if (w.length === 1 && w !== '*') { letters += w; return; }
    if (letters) tokens.push(letters);
    letters = '';
    tokens.push(w);
  });
  if (letters) tokens.push(letters);
  return tokens.map(squeeze);
};

const isOffensiveWord = (token) => {
  if (!token) return false;
  if (token.includes('*')) {
    if (token.replace(/\*/g, '').length < 2) return false;
    const re = new RegExp(`^${token.replace(/\*+/g, '[a-z]{1,2}')}$`);
    return [...EXACT].some((w) => re.test(w));
  }
  if (EXACT.has(token)) return true;
  return SUFFIX_ROOTS.some((root) => token.startsWith(root) && SUFFIXES.includes(token.slice(root.length)));
};

export const hasOffensiveLanguage = (text) => {
  const tokens = offensiveTokens(text);
  if (tokens.some(isOffensiveWord)) return true;
  const joined = ` ${tokens.join(' ')} `;
  return PHRASES.some((p) => joined.includes(` ${p} `));
};

// Spam ----------------------------------------------------------------------

const RUNS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm', 'abcdefghijklmnopqrstuvwxyz', '01234567890'];
const RUN_TEXT = [...RUNS, ...RUNS.map((r) => r.split('').reverse().join(''))];
const isKeyboardRun = (word) => (/^[a-z]+$/.test(word) ? word.length >= 4 : /^\d+$/.test(word) && word.length >= 5)
  && RUN_TEXT.some((run) => run.includes(word));

const wordsOf = (text) => plain(text).split(/[^a-z0-9]+/).filter(Boolean);

export const isSpam = (text) => {
  // aaaaa (letters only: 100000 is a real amount)
  if (/([a-z])\1{4,}/.test(plain(text))) return true;
  const words = wordsOf(text);
  if (words.some(isKeyboardRun)) return true;
  // hahaha, asdasdasd, lololol, but not Tagalog "kakakain" (just ate)
  if (words.some((w) => w.length >= 6 && /^(.{2,4})\1{2,}.?$/.test(w))) return true;
  let streak = 1;
  for (let i = 1; i < words.length; i += 1) {
    streak = words[i] === words[i - 1] ? streak + 1 : 1;
    if (streak >= 4) return true; // help help help help
  }
  return false;
};

// Meaningless ----------------------------------------------------------------

// Short forms people really use.
const KNOWN_ABBREVIATIONS = new Set(['brgy', 'bgy', 'bfp', 'pnp', 'cctv', 'lpg', 'mmda', 'dswd', 'ndrrmc', 'cdrrmo', 'mdrrmo', 'drrm', 'tnvs']);
// A long word with no vowels, or six consonants in a row ("fjdksl").
// Text-speak stays fine ("mrmng" for marami, "tlga" for talaga).
const isLetterSalad = (word) => /^[a-z]+$/.test(word) && !KNOWN_ABBREVIATIONS.has(word)
  && ((word.length >= 6 && !/[aeiouy]/.test(word)) || /[^aeiouy]{6,}/.test(word));

export const isMeaningless = (text) => {
  const lower = plain(text).trim();
  if (!lower) return false;
  if (!/[a-z]/.test(lower)) return lower.replace(/\s/g, '').length >= 2; // only numbers / symbols
  const words = wordsOf(lower).filter((w) => /[a-z]/.test(w) && w.length >= 4);
  if (!words.length) return false;
  const salad = words.filter(isLetterSalad).length;
  return salad > 0 && salad * 2 >= words.length;
};

// The first problem with a text of this kind: 'offensive', 'spam',
// 'meaningless', or null when it's fine. An empty text is fine here (required
// fields are checked elsewhere).
export const checkText = (text, kind = 'description') => {
  if (!String(text || '').trim()) return null;
  if (hasOffensiveLanguage(text)) return 'offensive';
  if (kind === 'number') return /([a-z])\1{4,}/.test(plain(text)) ? 'spam' : null;
  if (isSpam(text)) return 'spam';
  if (kind === 'description' && isMeaningless(text)) return 'meaningless';
  return null;
};

// The English message for each problem (the forms show the translated
// reportForm.textCheck.* text).
export const TEXT_MESSAGES = {
  offensive: 'Please remove inappropriate or offensive language.',
  spam: 'Avoid using repeated or random characters.',
  meaningless: 'Please provide meaningful information about your report.'
};
