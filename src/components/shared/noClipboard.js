// For password boxes on the sign-in and sign-up screens: no copying, cutting,
// pasting or dropping text in, so a password is typed by hand. Typing,
// the show/hide button and the browser's own password manager still work.
const block = (e) => e.preventDefault();

export const NO_CLIPBOARD = {
  onCopy: block,
  onCut: block,
  onPaste: block,
  onDrop: block,
  onDragStart: block
};
