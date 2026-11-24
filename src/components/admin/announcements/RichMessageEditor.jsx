import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { messageToHtml } from "../../shared/FormattedText";
import { tx } from "../../../i18n/adminText";

// The announcement Message box: what you see is what residents get. Selected
// text turns bold / italic right in the box (B / I buttons or Ctrl+B /
// Ctrl+I); line breaks and blank lines stay. The value going in and out is
// the same plain text the rest of the app stores and shows (FormattedText),
// where **…** marks bold and _…_ italic; the admin never sees those marks.
// Pasted text comes in as plain text, so other sites' styles don't follow it.

const BLOCKS = new Set(["DIV", "P", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "BLOCKQUOTE", "PRE", "UL", "OL"]);

const isBold = (el) => {
  if (el.tagName === "B" || el.tagName === "STRONG") return true;
  const w = el.style && el.style.fontWeight;
  return w === "bold" || w === "bolder" || Number(w) >= 600;
};
const isItalic = (el) => el.tagName === "I" || el.tagName === "EM" || (el.style && el.style.fontStyle === "italic");

// Spaces at the edges stay outside the marks ("**word** next", not "**word **next").
const wrap = (text, mark) => {
  if (!text.trim()) return text;
  const lead = text.match(/^\s*/)[0];
  const trail = text.slice(lead.length).match(/\s*$/)[0];
  const core = text.slice(lead.length, text.length - trail.length);
  // A line break inside: mark each line, so every line shows formatted.
  if (core.includes("\n")) return lead + core.split("\n").map((line) => wrap(line, mark)).join("\n") + trail;
  return `${lead}${mark}${core}${mark}${trail}`;
};

// The editor's content as stored text.
export const htmlToMessage = (root) => {
  const walk = (node, inBold, inItalic) => {
    let out = "";
    node.childNodes.forEach((child) => {
      if (child.nodeType === 3) {
        out += child.nodeValue.replace(/ /g, " ");
        return;
      }
      if (child.nodeType !== 1) return;
      if (child.tagName === "BR") {
        out += "\n";
        return;
      }
      const bold = !inBold && isBold(child);
      const italic = !inItalic && isItalic(child);
      let inner = walk(child, inBold || bold, inItalic || italic);
      if (italic) inner = wrap(inner, "_");
      if (bold) inner = wrap(inner, "**");
      if (BLOCKS.has(child.tagName)) {
        // A block starts on its own line ("a<div>b</div>" is "a\nb").
        if (out && !out.endsWith("\n")) out += "\n";
        out += inner;
        if (!inner.endsWith("\n")) out += "\n";
      } else {
        out += inner;
      }
    });
    return out;
  };
  let text = walk(root, false, false);
  // Browsers end the box with a line break the admin didn't type.
  if (text.endsWith("\n")) text = text.slice(0, -1);
  return text;
};

const RichMessageEditor = ({ id, labelledBy, value, onChange, placeholder, disabled, describedBy }) => {
  const boxRef = useRef(null);
  const lastValue = useRef(null);
  const [active, setActive] = useState({ bold: false, italic: false });

  // Show `value` in the box when it changes from outside (a draft brought
  // back, Start over, an announcement opened for editing), not while typing.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || value === lastValue.current) return;
    box.innerHTML = messageToHtml(value);
    lastValue.current = value;
  }, [value]);

  const emit = useCallback(() => {
    const box = boxRef.current;
    if (!box) return;
    const text = htmlToMessage(box);
    lastValue.current = text;
    onChange(text);
  }, [onChange]);

  const refreshActive = useCallback(() => {
    const box = boxRef.current;
    const sel = window.getSelection && window.getSelection();
    if (!box || !sel || !sel.rangeCount || !box.contains(sel.anchorNode)) return;
    try {
      setActive({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic")
      });
    } catch { /* not supported: buttons just don't light up */ }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  const format = (command) => {
    const box = boxRef.current;
    if (!box || disabled) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !box.contains(sel.anchorNode)) box.focus();
    let done = false;
    try {
      document.execCommand("styleWithCSS", false, false);
      done = document.execCommand(command, false, null);
    } catch { /* not available: wrap by hand below */ }
    if (!done) {
      const s = window.getSelection();
      if (s && s.rangeCount && !s.isCollapsed && box.contains(s.anchorNode)) {
        const range = s.getRangeAt(0);
        const el = document.createElement(command === "bold" ? "strong" : "em");
        el.appendChild(range.extractContents());
        range.insertNode(el);
        s.removeAllRanges();
        const after = document.createRange();
        after.selectNodeContents(el);
        s.addRange(after);
      }
    }
    emit();
    refreshActive();
  };

  const onKeyDown = (e) => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const key = e.key.toLowerCase();
    if (key === "b" || key === "i") {
      e.preventDefault();
      format(key === "b" ? "bold" : "italic");
    } else if (key === "u") {
      e.preventDefault(); // underline isn't offered
    }
  };

  const onPaste = (e) => {
    const text = e.clipboardData && e.clipboardData.getData("text/plain");
    if (text == null) return;
    e.preventDefault();
    if (!document.execCommand("insertText", false, text)) {
      // Fallback: put the text in at the cursor by hand.
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(text));
        range.collapse(false);
      }
    }
    emit();
  };

  const onDrop = (e) => {
    // Dropped text also comes in plain.
    const text = e.dataTransfer && e.dataTransfer.getData("text/plain");
    if (!text) return;
    e.preventDefault();
    boxRef.current?.focus();
    document.execCommand("insertText", false, text);
    emit();
  };

  const toolButton = (command, icon, label, shortcut) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the text selected
      onClick={() => format(command)}
      aria-label={tx(label)}
      aria-pressed={active[command]}
      title={`${tx(label)} (${shortcut})`}
      className={active[command] ? "on" : ""}
      disabled={disabled}
    >
      <i className={`bi ${icon}`} aria-hidden="true"></i>
    </button>
  );

  return (
    <div className="anf-editor">
      <div className="anf-toolbar" role="toolbar" aria-label={tx("Text formatting")} aria-controls={id}>
        {toolButton("bold", "bi-type-bold", "Bold", "Ctrl+B")}
        {toolButton("italic", "bi-type-italic", "Italic", "Ctrl+I")}
        <span className="anf-toolbar-hint">{tx("Select text, then tap B or I")}</span>
      </div>
      <div
        id={id}
        ref={boxRef}
        className={`anf-input anf-textarea anf-rich${value ? "" : " is-empty"}`}
        contentEditable={!disabled}
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        aria-required="true"
        data-placeholder={placeholder}
        spellCheck
        onInput={emit}
        onBlur={emit}
        onKeyDown={onKeyDown}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onPaste={onPaste}
        onDrop={onDrop}
      />
    </div>
  );
};

export default RichMessageEditor;
