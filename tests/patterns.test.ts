import { describe, it, expect } from 'vitest';
import { PATTERNS } from '../src/patterns.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function matchAll(label: string, content: string): string[] {
  const pattern = PATTERNS.find(p => p.label === label);
  if (!pattern) throw new Error(`Pattern not found: "${label}"`);
  const re = pattern.regex();
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) results.push(m[1]);
  return results;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PATTERNS', () => {

  // ── 1. HTML attribute ──────────────────────────────────────────────────────
  describe('HTML attribute (JSX / Vue / Angular / Svelte / HTML)', () => {
    const L = 'HTML attribute (JSX / Vue / Angular / Svelte / HTML)';

    it('matches double-quoted name attribute', () => {
      expect(matchAll(L, '<ion-icon name="add-outline" />')).toEqual(['add-outline']);
    });

    it('matches single-quoted name attribute', () => {
      expect(matchAll(L, "<ion-icon name='add-outline' />")).toEqual(['add-outline']);
    });

    it('matches when other attributes come before name', () => {
      expect(matchAll(L, '<ion-icon size="small" name="trash" />')).toEqual(['trash']);
    });

    it('matches multiline tag', () => {
      const content = '<ion-icon\n  size="large"\n  name="home"\n/>';
      expect(matchAll(L, content)).toEqual(['home']);
    });

    it('matches closing-tag style', () => {
      expect(matchAll(L, '<ion-icon name="close"></ion-icon>')).toEqual(['close']);
    });

    it('matches multiple icons in the same content', () => {
      const content = '<ion-icon name="home" />\n<ion-icon name="trash" />';
      expect(matchAll(L, content)).toEqual(['home', 'trash']);
    });

    it('does not match non-ion-icon elements', () => {
      expect(matchAll(L, '<div name="add-outline" />')).toEqual([]);
      expect(matchAll(L, '<my-icon name="add-outline" />')).toEqual([]);
    });

    it('does not match when name attribute is missing', () => {
      expect(matchAll(L, '<ion-icon size="small" />')).toEqual([]);
    });
  });

  // ── 2. Mithril hyperscript ─────────────────────────────────────────────────
  describe('Mithril hyperscript', () => {
    const L = 'Mithril hyperscript';

    it('matches single-quoted selector and name', () => {
      expect(matchAll(L, "m('ion-icon', { name: 'add-outline' })")).toEqual(['add-outline']);
    });

    it('matches double-quoted selector and name', () => {
      expect(matchAll(L, 'm("ion-icon", { name: "trash" })')).toEqual(['trash']);
    });

    it('matches when extra properties come before name', () => {
      expect(matchAll(L, "m('ion-icon', { size: 'small', name: 'menu' })")).toEqual(['menu']);
    });

    it('does not match m() calls for other elements', () => {
      expect(matchAll(L, "m('div', { name: 'add-outline' })")).toEqual([]);
    });
  });

  // ── 3. Vue :name dynamic binding ──────────────────────────────────────────
  describe("Vue :name=\"'...'\"", () => {
    const L = "Vue :name=\"'...'\"";

    it('matches :name with string literal', () => {
      expect(matchAll(L, `<ion-icon :name="'add-outline'" />`)).toEqual(['add-outline']);
    });

    it('matches when other attributes are present', () => {
      expect(matchAll(L, `<ion-icon size="small" :name="'home'" />`)).toEqual(['home']);
    });

    it('does not match :name with a variable', () => {
      expect(matchAll(L, '<ion-icon :name="dynamicIcon" />')).toEqual([]);
    });
  });

  // ── 4. Angular [name] property binding ────────────────────────────────────
  describe("Angular [name]=\"'...'\"", () => {
    const L = "Angular [name]=\"'...'\"";

    it('matches [name] with string literal', () => {
      expect(matchAll(L, `<ion-icon [name]="'checkmark-circle'"></ion-icon>`)).toEqual(['checkmark-circle']);
    });

    it('matches when other attributes are present', () => {
      expect(matchAll(L, `<ion-icon slot="start" [name]="'arrow-back'"></ion-icon>`)).toEqual(['arrow-back']);
    });

    it('does not match [name] with a variable', () => {
      expect(matchAll(L, '<ion-icon [name]="iconVar"></ion-icon>')).toEqual([]);
    });
  });

  // ── 5. HTM tagged template literal ────────────────────────────────────────
  describe('HTM / tagged template literal', () => {
    const L = 'HTM / tagged template literal';

    it('matches icon inside html tagged template', () => {
      const content = 'const t = html`<ion-icon name="add-outline"></ion-icon>`';
      expect(matchAll(L, content)).toEqual(['add-outline']);
    });

    it('does not match outside a tagged template', () => {
      expect(matchAll(L, '<ion-icon name="add-outline" />')).toEqual([]);
    });
  });

  // ── 6. React createElement ────────────────────────────────────────────────
  describe('React createElement', () => {
    const L = 'React createElement';

    it('matches React.createElement with ion-icon', () => {
      expect(matchAll(L, "React.createElement('ion-icon', { name: 'add-outline' })")).toEqual(['add-outline']);
    });

    it('matches bare createElement with ion-icon', () => {
      expect(matchAll(L, "createElement('ion-icon', { name: 'trash' })")).toEqual(['trash']);
    });

    it('does not match createElement for other elements', () => {
      expect(matchAll(L, "createElement('div', { name: 'add-outline' })")).toEqual([]);
    });
  });

  // ── 7. h() hyperscript ────────────────────────────────────────────────────
  describe('h() hyperscript (Preact / generic VDOM)', () => {
    const L = 'h() hyperscript (Preact / generic VDOM)';

    it('matches h() with single quotes', () => {
      expect(matchAll(L, "h('ion-icon', { name: 'heart' })")).toEqual(['heart']);
    });

    it('matches h() with double quotes', () => {
      expect(matchAll(L, 'h("ion-icon", { name: "close" })')).toEqual(['close']);
    });

    it('matches h() with extra properties before name', () => {
      expect(matchAll(L, "h('ion-icon', { class: 'icon', name: 'star' })")).toEqual(['star']);
    });

    it('does not match h() for other elements', () => {
      expect(matchAll(L, "h('button', { name: 'add-outline' })")).toEqual([]);
    });
  });

});
