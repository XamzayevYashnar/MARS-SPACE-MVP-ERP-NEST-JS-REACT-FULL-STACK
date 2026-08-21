import {
  sanitizeLocalizedRichText,
  sanitizeRichText,
  stripHtml,
  stripLocalizedHtml,
} from './sanitize-html.util';

describe('sanitizeRichText', () => {
  it('keeps the whitelisted formatting tags', () => {
    const input = '<p>Salom <strong>dunyo</strong></p><ul><li>bir</li></ul>';

    expect(sanitizeRichText(input)).toBe(input);
  });

  it('removes script tags and their contents', () => {
    expect(sanitizeRichText('<p>Yaxshi</p><script>alert(1)</script>')).toBe('<p>Yaxshi</p>');
  });

  it('removes inline event handlers', () => {
    expect(sanitizeRichText('<p onclick="steal()">Matn</p>')).toBe('<p>Matn</p>');
  });

  it('drops a javascript: link target', () => {
    expect(sanitizeRichText('<a href="javascript:alert(1)">Bos</a>')).not.toContain('javascript:');
  });

  it('adds rel=noopener to every link, so a new tab cannot reach window.opener', () => {
    expect(sanitizeRichText('<a href="https://example.com">Havola</a>')).toContain(
      'rel="noopener noreferrer"',
    );
  });

  it('discards a tag that is not on the whitelist', () => {
    expect(sanitizeRichText('<iframe src="https://evil.example"></iframe>')).toBe('');
  });

  it('keeps images with their https source', () => {
    expect(sanitizeRichText('<img src="https://cdn.example/a.png" alt="a">')).toContain('img');
  });
});

describe('stripHtml', () => {
  it('removes every tag and keeps the text', () => {
    expect(stripHtml('<p>Salom <b>dunyo</b></p>')).toBe('Salom dunyo');
  });

  it('drops script content entirely rather than leaving the source visible', () => {
    expect(stripHtml('<script>alert(1)</script>Salom')).toBe('Salom');
  });

  it('trims the result', () => {
    expect(stripHtml('   Salom   ')).toBe('Salom');
  });
});

describe('localised wrappers', () => {
  it('sanitises each locale of a rich-text field', () => {
    const result = sanitizeLocalizedRichText({
      uz: '<p>Salom</p><script>x</script>',
      ru: '<p>Привет</p>',
      en: '',
    });

    expect(result).toEqual({ uz: '<p>Salom</p>', ru: '<p>Привет</p>', en: '' });
  });

  it('strips tags from each locale of a plain-text field', () => {
    expect(
      stripLocalizedHtml({ uz: '<b>Salom</b>', ru: '<i>Привет</i>', en: '<u>Hi</u>' }),
    ).toEqual({ uz: 'Salom', ru: 'Привет', en: 'Hi' });
  });
});
