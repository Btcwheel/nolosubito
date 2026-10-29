import sanitizeHtml from "sanitize-html";

// Pulizia dell'HTML degli articoli sul server (DOMPurify richiede un DOM, qui non c'è).
// Stesse regole del CMS: formattazione, link, immagini e tabelle; niente script, iframe o handler inline.
const OPTIONS = {
  allowedTags: [
    ...sanitizeHtml.defaults.allowedTags,
    "img", "figure", "figcaption", "h1", "h2", "h3", "h4", "h5", "h6", "u", "s", "mark", "small", "sub", "sup", "del", "ins", "hr", "br", "span", "div",
  ],
  allowedAttributes: {
    "*": ["class", "id", "title", "lang", "dir", "style"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "width", "height", "loading"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
  },
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb\(/i],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "font-style": [/^(normal|italic)$/],
      "text-decoration": [/^(none|underline|line-through)$/],
      width: [/^\d+(\.\d+)?(px|%|em|rem)$/],
      height: [/^\d+(\.\d+)?(px|%|em|rem)$/],
      "max-width": [/^\d+(\.\d+)?(px|%|em|rem)$/],
    },
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    // I link esterni si aprono in una nuova scheda senza passare il riferimento alla pagina.
    a: (tagName, attribs) => (attribs.target === "_blank" ? { tagName, attribs: { ...attribs, rel: "noopener noreferrer" } } : { tagName, attribs }),
  },
};

export function sanitizeArticleHtml(html) {
  return sanitizeHtml(html ?? "", OPTIONS);
}
