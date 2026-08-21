import { toOptionalBoolean, toStringArray, toTrimmedString } from './transform.util';

describe('toOptionalBoolean', () => {
  it.each([[true], ['true'], ['1']])('reads %p as true', (value) => {
    expect(toOptionalBoolean({ value })).toBe(true);
  });

  it.each([[false], ['false'], ['0']])('reads %p as false', (value) => {
    expect(toOptionalBoolean({ value })).toBe(false);
  });

  it('drops anything else, so the filter is simply absent', () => {
    expect(toOptionalBoolean({ value: undefined })).toBeUndefined();
    expect(toOptionalBoolean({ value: 'maybe' })).toBeUndefined();
    expect(toOptionalBoolean({ value: null })).toBeUndefined();
  });
});

describe('toTrimmedString', () => {
  it('trims a string', () => {
    expect(toTrimmedString({ value: '  react  ' })).toBe('react');
  });

  it('drops a blank string', () => {
    expect(toTrimmedString({ value: '   ' })).toBeUndefined();
  });

  it('drops a non-string', () => {
    expect(toTrimmedString({ value: 42 })).toBeUndefined();
  });
});

describe('toStringArray', () => {
  it('splits a comma-separated value', () => {
    expect(toStringArray({ value: 'a, b ,c' })).toEqual(['a', 'b', 'c']);
  });

  it('passes an existing array through, dropping non-strings', () => {
    expect(toStringArray({ value: ['a', 1, 'b'] })).toEqual(['a', 'b']);
  });

  it('drops an empty or non-string value', () => {
    expect(toStringArray({ value: '  ,  ' })).toBeUndefined();
    expect(toStringArray({ value: 42 })).toBeUndefined();
  });
});
