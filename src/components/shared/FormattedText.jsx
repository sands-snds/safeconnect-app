import React from "react";

// Announcement text formatting. Messages are stored as plain text with two
// light markers the admin's Bold / Italic buttons add:
//   **bold text**   and   _italic text_
// Line breaks and blank lines (paragraph spacing) are kept as typed. No HTML is
// ever stored or injected: the markers become React <strong> / <em> elements.
// The backend's announcement email (emailService.js) follows the same rules.

// **bold** first, then _italic_ (italic markers must sit at word edges so
// snake_case words and URLs aren't touched).
const TOKEN = /\*\*([\s\S]+?)\*\*|(^|[^\w])_([^_\n](?:[^_\n]*[^_\n])?)_(?![\w])/g;

const parseInline = (text, keyPrefix, depth = 0) => {
    const out = [];
    let last = 0;
    let match;
    let i = 0;
    const re = new RegExp(TOKEN.source, "g");
    while ((match = re.exec(text))) {
        if (match[1] !== undefined) {
            if (match.index > last) out.push(text.slice(last, match.index));
            const inner = depth < 2 ? parseInline(match[1], `${keyPrefix}b${i}`, depth + 1) : match[1];
            out.push(<strong key={`${keyPrefix}b${i}`}>{inner}</strong>);
            last = match.index + match[0].length;
        } else {
            const lead = match[2] || "";
            const start = match.index + lead.length;
            if (start > last) out.push(text.slice(last, start));
            const inner = depth < 2 ? parseInline(match[3], `${keyPrefix}i${i}`, depth + 1) : match[3];
            out.push(<em key={`${keyPrefix}i${i}`}>{inner}</em>);
            last = match.index + match[0].length;
        }
        i += 1;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
};

// The message with its formatting, ready to drop inside an element styled
// with `white-space: pre-wrap` (so spaces, line breaks and blank lines show
// exactly as typed).
export const formatMessage = (text) => parseInline(String(text || ""), "f");

// The message without the markers: for share text, search and emails'
// plain-text parts.
export const stripFormatting = (text) =>
    String(text || "")
        .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
        .replace(/(^|[^\w])_([^_\n](?:[^_\n]*[^_\n])?)_(?![\w])/g, "$1$2");

// <FormattedText as="p" className="..." text={message} />
const FormattedText = ({ text, as: Tag = "p", className, style }) => (
    <Tag className={className} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", ...style }}>
        {formatMessage(text)}
    </Tag>
);

export default FormattedText;
