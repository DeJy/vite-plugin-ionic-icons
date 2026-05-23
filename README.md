# vite-plugin-ionic-icons

> Vite plugin that auto-detects and bundles **only the Ionic icons your project uses** — icon tree-shaking with zero config.

When using [`@ionic/core`](https://ionicframework.com/) with Vite, the full icon set (~1 300 SVG files) would normally be served or copied entirely. This plugin solves that in two ways:

- **Dev mode** — a dev-server middleware serves icons on-demand directly from `node_modules`. No copying.
- **Build mode** — your source files are scanned for every `<ion-icon name="...">` usage and **only those icons are emitted** as build assets.

Supports all major frameworks: **React, Vue, Angular, Svelte, Mithril, Preact, SolidJS, plain HTML**.

---

## Installation

```bash
npm install -D vite-plugin-ionic-icons
```

> **Peer dependency:** `vite >= 4.0.0`  
> **Requires** `@ionic/core` to be installed (it provides the SVG files).

---

## Usage

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import ionicIcons from 'vite-plugin-ionic-icons';

export default defineConfig({
  plugins: [
    ionicIcons(),
  ],
});
```

That's it. Icons are served from `/svg/<name>.svg` in dev and emitted to `svg/` in your build output.

---

## Options

```ts
ionicIcons({
  // Source directory (or array of directories) to scan for icon usage.
  // Default: './src'
  srcDir: './src',

  // Extra file extensions to include in the scan.
  // Default: ['.js', '.ts', '.jsx', '.tsx', '.html', '.vue', '.svelte']
  extensions: ['.js', '.ts', '.jsx', '.tsx', '.html', '.vue', '.svelte'],

  // Icon names to always include, even if not found in source files.
  // Useful for icons loaded dynamically at runtime.
  // Default: []
  extraIcons: ['warning-outline', 'help-circle'],

  // Path to the directory containing Ionic's SVG files.
  // Default: 'node_modules/@ionic/core/dist/ionic/svg'
  iconSrcDir: 'node_modules/@ionic/core/dist/ionic/svg',

  // Sub-directory name used for serving / emitting icons.
  // Default: 'svg'
  iconDestDir: 'svg',

  // Log detected icons and emit count.
  // Default: false
  verbose: true,
})
```

---

## Framework examples

The plugin detects static icon names across all common syntaxes.

### React / JSX / TSX

```tsx
<ion-icon name="add-outline" />
<ion-icon name="trash" size="small" />
```

### Vue (static binding)

```html
<!-- static -->
<ion-icon name="add-outline" />

<!-- string literal in dynamic binding -->
<ion-icon :name="'add-outline'" />
```

> Dynamic bindings like `:name="myVar"` cannot be resolved at build time.
> Use `extraIcons` to add them manually.

### Angular (static binding)

```html
<!-- static -->
<ion-icon name="add-outline"></ion-icon>

<!-- string literal in property binding -->
<ion-icon [name]="'add-outline'"></ion-icon>
```

### Svelte

```html
<ion-icon name="add-outline" />
```

### Mithril

```js
m('ion-icon', { name: 'add-outline' })
m("ion-icon", { name: "trash", size: "small" })
```

### Preact / h()

```js
h('ion-icon', { name: 'add-outline' })
```

### Plain HTML

```html
<ion-icon name="add-outline"></ion-icon>
```

---

## Dynamic icons

If you resolve icon names at runtime (e.g. from an API or a config object), the scanner cannot detect them. Add them with `extraIcons`:

```ts
ionicIcons({
  extraIcons: ['warning-outline', 'checkmark-circle', 'close-circle'],
})
```

---

## How it works

```
Build time
  └── generateBundle()
        ├── scan srcDir recursively
        ├── apply 7 regex patterns (one per framework)
        ├── deduplicate icon names
        └── emitFile() for each used icon → dist/svg/<name>.svg

Dev time
  └── configureServer()
        └── middleware: GET /svg/<name>.svg
              └── pipe from node_modules/@ionic/core/dist/ionic/svg/<name>.svg
```

---

## License

MIT © [Dominic Jean](https://github.com/DeJy)
