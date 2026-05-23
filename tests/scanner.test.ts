import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanFile, scan } from '../src/scanner.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES_SRC = path.resolve(__dirname, 'fixtures/src');

// ─── scanFile() ───────────────────────────────────────────────────────────────

describe('scanFile()', () => {

  it('detects static JSX/TSX icons in a React file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'react.tsx'));
    expect(icons).toContain('add-outline');
    expect(icons).toContain('trash');
  });

  it('detects createElement icons in a React file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'react.tsx'));
    expect(icons).toContain('home');
  });

  it('deduplicates icons within a single file', () => {
    // react.tsx has <ion-icon name="add-outline" /> twice
    const icons = scanFile(path.join(FIXTURES_SRC, 'react.tsx'));
    expect(icons.filter(i => i === 'add-outline')).toHaveLength(1);
  });

  it('detects static and :name binding icons in a Vue file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'vue.vue'));
    expect(icons).toContain('add-outline');
    expect(icons).toContain('star');
    expect(icons).toContain('home');
  });

  it('does NOT detect dynamic variable bindings in a Vue file', () => {
    // :name="dynamicIcon" should not be matched
    const icons = scanFile(path.join(FIXTURES_SRC, 'vue.vue'));
    expect(icons).not.toContain('dynamicIcon');
    expect(icons).not.toContain('some-runtime-icon');
  });

  it('detects static and [name] binding icons in an Angular file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'angular.html'));
    expect(icons).toContain('arrow-back');
    expect(icons).toContain('checkmark-circle');
  });

  it('detects icons in a Svelte file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'svelte.svelte'));
    expect(icons).toContain('close');
  });

  it('detects Mithril hyperscript icons', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'mithril.js'));
    expect(icons).toContain('menu');
    // mithril.js has "menu" twice — must deduplicate
    expect(icons.filter(i => i === 'menu')).toHaveLength(1);
  });

  it('detects h() hyperscript icons in a Preact file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'preact.jsx'));
    expect(icons).toContain('heart');
  });

  it('detects icons in a plain HTML file', () => {
    const icons = scanFile(path.join(FIXTURES_SRC, 'html.html'));
    expect(icons).toContain('home');
    expect(icons).toContain('add-outline');
  });

  it('returns an empty array for a non-existent file', () => {
    expect(scanFile('/non/existent/path/file.tsx')).toEqual([]);
  });

});

// ─── scan() ───────────────────────────────────────────────────────────────────

describe('scan()', () => {

  it('returns a sorted array', () => {
    const icons = scan({ srcDir: FIXTURES_SRC });
    expect(icons).toEqual([...icons].sort());
  });

  it('returns a deduplicated array across all files', () => {
    const icons = scan({ srcDir: FIXTURES_SRC });
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('detects icons from all framework fixture files', () => {
    const icons = scan({ srcDir: FIXTURES_SRC });
    // React (JSX + createElement)
    expect(icons).toContain('add-outline');
    expect(icons).toContain('trash');
    expect(icons).toContain('home');
    // Vue (:name)
    expect(icons).toContain('star');
    // Angular ([name])
    expect(icons).toContain('arrow-back');
    expect(icons).toContain('checkmark-circle');
    // Svelte
    expect(icons).toContain('close');
    // Mithril
    expect(icons).toContain('menu');
    // Preact h()
    expect(icons).toContain('heart');
  });

  it('merges extraIcons into the result', () => {
    const icons = scan({ srcDir: FIXTURES_SRC, extraIcons: ['warning-outline'] });
    expect(icons).toContain('warning-outline');
  });

  it('extraIcons are included even when srcDir is empty', () => {
    const icons = scan({ srcDir: '/non/existent/dir', extraIcons: ['warning-outline'] });
    expect(icons).toEqual(['warning-outline']);
  });

  it('returns an empty array for a non-existent directory (no extraIcons)', () => {
    expect(scan({ srcDir: '/non/existent/dir' })).toEqual([]);
  });

  it('accepts an array of source directories', () => {
    const single = scan({ srcDir: FIXTURES_SRC });
    const multi  = scan({ srcDir: [FIXTURES_SRC, '/non/existent/dir'] });
    expect(multi).toEqual(single);
  });

  it('filters files by extension', () => {
    const tsxOnly = scan({ srcDir: FIXTURES_SRC, extensions: ['.tsx'] });
    const all     = scan({ srcDir: FIXTURES_SRC });
    // .tsx only picks up the react.tsx file
    expect(tsxOnly).toContain('add-outline');
    expect(tsxOnly).toContain('trash');
    expect(tsxOnly.length).toBeLessThan(all.length);
  });

  it('scans srcDir without any options (defaults)', () => {
    // Should not throw and should return an array
    const icons = scan({ srcDir: FIXTURES_SRC });
    expect(Array.isArray(icons)).toBe(true);
  });

});
