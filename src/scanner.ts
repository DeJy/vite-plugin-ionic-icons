import fs from 'fs';
import path from 'path';
import { PATTERNS } from './patterns.js';

export interface ScannerOptions {
  /**
   * Source directory (or list of directories) to scan.
   * @default './src'
   */
  srcDir?: string | string[];

  /**
   * File extensions to include in the scan.
   * @default ['.js', '.ts', '.jsx', '.tsx', '.html', '.vue', '.svelte']
   */
  extensions?: string[];

  /**
   * Additional icon names to always include in the output,
   * regardless of whether they appear in source files.
   * Useful for dynamically-resolved icon names.
   * @default []
   */
  extraIcons?: string[];
}

const DEFAULT_EXTENSIONS = [
  '.js', '.ts', '.jsx', '.tsx',
  '.html', '.vue', '.svelte',
];

/**
 * Extract all ion-icon names from a single file using every registered pattern.
 */
export function scanFile(filePath: string): string[] {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return [];
  }

  const icons = new Set<string>();

  for (const { regex } of PATTERNS) {
    const re = regex(); // fresh instance — resets lastIndex
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      icons.add(match[1].toLowerCase());
    }
  }

  return [...icons];
}

/**
 * Recursively scan a directory and return all detected icon names.
 */
function scanDir(dir: string, extensions: string[]): string[] {
  const icons: string[] = [];

  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      icons.push(...scanDir(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      icons.push(...scanFile(fullPath));
    }
  }

  return icons;
}

/**
 * Scan all configured source directories and return the deduplicated
 * list of used Ionic icon names (no extension, no path).
 */
export function scan(options: ScannerOptions = {}): string[] {
  const {
    srcDir = './src',
    extensions = DEFAULT_EXTENSIONS,
    extraIcons = [],
  } = options;

  const dirs = Array.isArray(srcDir) ? srcDir : [srcDir];
  const allIcons = new Set<string>(extraIcons);

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      for (const icon of scanDir(dir, extensions)) {
        allIcons.add(icon);
      }
    }
  }

  return [...allIcons].sort();
}
