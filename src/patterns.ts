/**
 * Regex patterns to detect ion-icon usage across different frameworks.
 *
 * Each pattern returns the icon name in capture group 1.
 * Patterns are functions (not constants) to avoid stateful `lastIndex` bugs
 * when reusing a regex with the `g` flag across multiple file reads.
 */

export interface PatternDef {
  /** Human-readable label for debugging / verbose output */
  label: string;
  /** Factory that returns a fresh RegExp (avoids lastIndex state bugs) */
  regex: () => RegExp;
}

export const PATTERNS: PatternDef[] = [
  {
    /**
     * Static HTML attribute — covers React JSX, Vue (static), Angular (static),
     * Svelte, and plain HTML.
     *
     * @example
     *   <ion-icon name="add-outline" />
     *   <ion-icon size="small" name="add-outline" />
     *   <ion-icon
     *     name="add-outline"
     *   />
     */
    label: 'HTML attribute (JSX / Vue / Angular / Svelte / HTML)',
    // (?<![:\[]) prevents matching :name="var" (Vue dynamic) and [name]="var" (Angular)
    regex: () => /<ion-icon\s+[^>]*?(?<![:\[])\bname=["']([\w-]+)["']/gs,
  },
  {
    /**
     * Mithril hyperscript (both quoted styles).
     *
     * @example
     *   m('ion-icon', { name: 'add-outline' })
     *   m("ion-icon", { name: "add-outline" })
     */
    label: 'Mithril hyperscript',
    regex: () => /m\(\s*["']ion-icon["']\s*,\s*\{[^}]*?\bname\s*:\s*["']([\w-]+)["']/gs,
  },
  {
    /**
     * Vue dynamic binding with a string literal.
     *
     * @example
     *   <ion-icon :name="'add-outline'" />
     */
    label: "Vue :name=\"'...'\"",
    regex: () => /ion-icon[^>]*?:name=["']'([\w-]+)'["']/gs,
  },
  {
    /**
     * Angular property binding with a string literal.
     *
     * @example
     *   <ion-icon [name]="'add-outline'"></ion-icon>
     */
    label: "Angular [name]=\"'...'\"",
    regex: () => /ion-icon[^>]*?\[name\]=["']'([\w-]+)'["']/gs,
  },
  {
    /**
     * Preact / HTM tagged template literals.
     *
     * @example
     *   html`<ion-icon name="add-outline"></ion-icon>`
     */
    label: 'HTM / tagged template literal',
    regex: () => /html`[^`]*?<ion-icon[^>]*?\bname=["']([\w-]+)["']/gs,
  },
  {
    /**
     * React createElement (rare but valid).
     *
     * @example
     *   React.createElement('ion-icon', { name: 'add-outline' })
     *   createElement('ion-icon', { name: 'add-outline' })
     */
    label: 'React createElement',
    regex: () => /createElement\(\s*["']ion-icon["']\s*,\s*\{[^}]*?\bname\s*:\s*["']([\w-]+)["']/gs,
  },
  {
    /**
     * h() hyperscript (Preact, Solid, generic VDOM).
     *
     * @example
     *   h('ion-icon', { name: 'add-outline' })
     */
    label: 'h() hyperscript (Preact / generic VDOM)',
    regex: () => /h\(\s*["']ion-icon["']\s*,\s*\{[^}]*?\bname\s*:\s*["']([\w-]+)["']/gs,
  },
];
