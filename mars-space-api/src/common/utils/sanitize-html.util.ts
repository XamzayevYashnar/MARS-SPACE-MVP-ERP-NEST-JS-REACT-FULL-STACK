import sanitizeHtmlLib from 'sanitize-html';
import { LocalizedText } from '../interfaces';

/**
 * Conservative whitelist for rich-text fields (§6.4.7).
 *
 * Anything outside it is stripped before the value reaches the database, so a
 * compromised admin account cannot plant script into the public site.
 */
const OPTIONS: sanitizeHtmlLib.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'code',
    'pre',
    'a',
    'img',
    'figure',
    'figcaption',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'hr',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    '*': ['class'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https', 'data'] },
  transformTags: {
    // Never let user content open a tab that keeps access to `window.opener`.
    a: sanitizeHtmlLib.simpleTransform('a', { rel: 'noopener noreferrer' }),
  },
  disallowedTagsMode: 'discard',
};

export function sanitizeRichText(input: string): string {
  return sanitizeHtmlLib(input, OPTIONS);
}

/** Strips every tag — for fields that must stay plain text. */
export function stripHtml(input: string): string {
  return sanitizeHtmlLib(input, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** Sanitises each locale of a localised rich-text field. */
export function sanitizeLocalizedRichText(text: LocalizedText): LocalizedText {
  return {
    uz: sanitizeRichText(text.uz),
    ru: sanitizeRichText(text.ru),
    en: sanitizeRichText(text.en),
  };
}

/** Strips tags from each locale of a localised plain-text field. */
export function stripLocalizedHtml(text: LocalizedText): LocalizedText {
  return { uz: stripHtml(text.uz), ru: stripHtml(text.ru), en: stripHtml(text.en) };
}
