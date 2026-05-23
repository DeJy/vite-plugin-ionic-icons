import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import type { Plugin } from 'vite';
import { scan, type ScannerOptions } from './scanner.js';

export type { ScannerOptions };

export interface IonicIconsOptions extends ScannerOptions {
  /**
   * Path to the directory that contains Ionic's SVG icon files.
   * Resolved relative to `process.cwd()`.
   * @default 'node_modules/@ionic/core/dist/ionic/svg'
   */
  iconSrcDir?: string;

  /**
   * Output sub-directory name (relative to the build output root).
   * Icons are served at `/<iconDestDir>/<name>.svg` in dev mode,
   * and emitted as `<iconDestDir>/<name>.svg` in build mode.
   * @default 'svg'
   */
  iconDestDir?: string;

  /**
   * Print the list of detected icons and the number of emitted files.
   * @default false
   */
  verbose?: boolean;
}

const DEFAULT_ICON_SRC_DIR = 'node_modules/@ionic/core/dist/ionic/svg';
const DEFAULT_ICON_DEST_DIR = 'svg';
const PLUGIN_NAME = 'vite-plugin-ionic-icons';

/**
 * Vite plugin that:
 * - **Dev mode**: serves Ionic SVG icons directly from `node_modules` via a
 *   dev-server middleware (no copying required).
 * - **Build mode**: scans your source files for `<ion-icon name="...">` usage
 *   across all popular frameworks (React, Vue, Angular, Svelte, Mithril, …)
 *   and emits **only the icons you actually use** as build assets — giving you
 *   icon tree-shaking without any manual configuration.
 *
 * @example
 * // vite.config.ts
 * import { defineConfig } from 'vite';
 * import ionicIcons from 'vite-plugin-ionic-icons';
 *
 * export default defineConfig({
 *   plugins: [ionicIcons()],
 * });
 */
export function ionicIcons(options: IonicIconsOptions = {}): Plugin {
  const {
    iconSrcDir = DEFAULT_ICON_SRC_DIR,
    iconDestDir = DEFAULT_ICON_DEST_DIR,
    verbose = false,
    ...scannerOptions
  } = options;

  // Lazily computed — only once per build/serve session.
  let _usedIcons: string[] | null = null;

  function getIcons(): string[] {
    if (_usedIcons === null) {
      _usedIcons = scan(scannerOptions);
      if (verbose) {
        console.log(`\n[${PLUGIN_NAME}] Detected ${_usedIcons.length} icon(s):`);
        _usedIcons.forEach(name => console.log(`  · ${name}`));
      }
    }
    return _usedIcons;
  }

  return {
    name: PLUGIN_NAME,

    // ─── Dev server ───────────────────────────────────────────────────────────
    configureServer(server) {
      const prefix = `/${iconDestDir}/`;

      server.middlewares.use((req, res, next) => {
        if (!req.url?.startsWith(prefix)) return next();

        const iconName = req.url.slice(prefix.length).split('?')[0];
        if (!iconName.endsWith('.svg')) return next();

        const iconPath = path.resolve(iconSrcDir, iconName);
        if (!fs.existsSync(iconPath)) return next();

        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'no-cache');
        createReadStream(iconPath).pipe(res);
      });
    },

    // ─── Build ────────────────────────────────────────────────────────────────
    generateBundle() {
      const icons = getIcons();
      let emitted = 0;
      const missing: string[] = [];

      for (const name of icons) {
        const iconPath = path.resolve(iconSrcDir, `${name}.svg`);
        if (fs.existsSync(iconPath)) {
          this.emitFile({
            type: 'asset',
            fileName: `${iconDestDir}/${name}.svg`,
            source: fs.readFileSync(iconPath, 'utf-8'),
          });
          emitted++;
        } else {
          missing.push(name);
        }
      }

      if (verbose || emitted > 0) {
        console.log(`[${PLUGIN_NAME}] Emitted ${emitted} icon(s) → ${iconDestDir}/`);
      }
      if (missing.length > 0) {
        console.warn(
          `[${PLUGIN_NAME}] ${missing.length} icon(s) not found in ${iconSrcDir}:`,
          missing.join(', '),
        );
      }
    },
  };
}

export default ionicIcons;
