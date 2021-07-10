import { compile } from '../std/compile';
import { identifier } from '../std/core';

const compileNode = node => compile([node]).trim();

describe('list', () => {
  it('empty list', () =>
    expect(compileNode([])).toMatchInlineSnapshot(`"[];"`));

  it('primitive list', () =>
    expect(compileNode([null, 1, 1.3, 'foo-bar'])).toMatchInlineSnapshot(
      `"[null, 1, 1.3, \\"foo-bar\\"];"`,
    ));

  describe('+', () => {
    it('no parameters', () =>
      expect(compileNode([identifier('+')])).toMatchInlineSnapshot(`"0;"`));

    it('one parameter', () =>
      expect(compileNode([identifier('+'), 12])).toMatchInlineSnapshot(
        `"12;"`,
      ));

    it('many parameters', () =>
      expect(
        compileNode([identifier('+'), 12, 28, 11, 19]),
      ).toMatchInlineSnapshot(`"12 + 28 + 11 + 19;"`));
  });

  describe('-', () => {
    it('no parameters', () =>
      expect(compileNode([identifier('-')])).toMatchInlineSnapshot(`"0;"`));

    it('one parameter', () =>
      expect(compileNode([identifier('-'), 12])).toMatchInlineSnapshot(
        `"-12;"`,
      ));

    it('many parameters', () =>
      expect(
        compileNode([identifier('-'), 12, 28, 11, 19]),
      ).toMatchInlineSnapshot(`"12 - 28 - 11 - 19;"`));
  });

  describe('*', () => {
    it('no parameters', () =>
      expect(compileNode([identifier('*')])).toMatchInlineSnapshot(`"1;"`));

    it('one parameter', () =>
      expect(compileNode([identifier('*'), 12])).toMatchInlineSnapshot(
        `"12;"`,
      ));

    it('many parameters', () =>
      expect(
        compileNode([identifier('*'), 12, 28, 11, 19]),
      ).toMatchInlineSnapshot(`"12 * 28 * 11 * 19;"`));
  });

  describe('/', () => {
    it('no parameters', () =>
      expect(compileNode([identifier('/')])).toMatchInlineSnapshot(`"NaN;"`));

    it('one parameter', () =>
      expect(compileNode([identifier('/'), 2])).toMatchInlineSnapshot(
        `"1 / 2;"`,
      ));

    it('multiple parameters', () =>
      expect(compileNode([identifier('/'), 1, 2, 3, 4])).toMatchInlineSnapshot(
        `"1 / 2 / 3 / 4;"`,
      ));
  });

  describe('**', () => {
    it('no parameters', () =>
      expect(compileNode([identifier('**')])).toMatchInlineSnapshot(`"NaN;"`));

    it('one parameter', () =>
      expect(compileNode([identifier('**'), 2])).toMatchInlineSnapshot(
        `"NaN;"`,
      ));

    it('multiple parameters', () =>
      expect(compileNode([identifier('**'), 1, 2, 3, 4])).toMatchInlineSnapshot(
        `"((1 ** 2) ** 3) ** 4;"`,
      ));
  });

  describe('%', () => {
    it('no parameters', () =>
      expect(() => compileNode([identifier('mod')])).toThrow());

    it('one parameter', () =>
      expect(() => compileNode([identifier('mod'), 2])).toThrow());

    it('multiple parameters', () =>
      expect(
        compileNode([identifier('mod'), 1, 2, 3, 4]),
      ).toMatchInlineSnapshot(`"1 % 2 % 3 % 4;"`));
  });

  describe('typeof', () => {
    it('no parameters', () =>
      expect(() => compileNode([identifier('typeof')])).toThrow());

    it('one parameter', () =>
      expect(compileNode([identifier('typeof'), 1])).toMatchInlineSnapshot(
        `"typeof 1;"`,
      ));
  });
});
