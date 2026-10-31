

const GLOW_MS = 3400;

export const flashHighlight = (el, block = 'center') => {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block });
  el.classList.remove('sc-highlight');
  
  void el.offsetWidth;
  el.classList.add('sc-highlight');
  setTimeout(() => el.classList.remove('sc-highlight'), GLOW_MS);
};
