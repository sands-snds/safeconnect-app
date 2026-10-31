// Scrolls to what a notification points at and makes it glow for a few
// seconds (.sc-highlight in resident/navbar/NavbarStyle.css).
const GLOW_MS = 3400;

export const flashHighlight = (el, block = 'center') => {
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block });
  el.classList.remove('sc-highlight');
  // Restart the animation when the same item is highlighted twice in a row.
  void el.offsetWidth;
  el.classList.add('sc-highlight');
  setTimeout(() => el.classList.remove('sc-highlight'), GLOW_MS);
};
