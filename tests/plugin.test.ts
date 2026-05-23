import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ionicIcons } from '../src/index.js';

// Mock createReadStream so tests don't open real file streams.
// All other fs methods (existsSync, readFileSync, readdirSync) use the real
// implementation so the scanner can read the fixture source files.
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  const mockPipe = vi.fn();
  const mockCreateReadStream = vi.fn(() => ({ pipe: mockPipe }));
  return {
    ...actual,
    default: { ...actual, createReadStream: mockCreateReadStream },
    createReadStream: mockCreateReadStream,
  };
});

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const FIXTURES_SVG = path.resolve(__dirname, 'fixtures/svg');
const FIXTURES_SRC = path.resolve(__dirname, 'fixtures/src');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeServer() {
  let captured: Function | undefined;
  return {
    middlewares: { use: vi.fn((fn: Function) => { captured = fn; }) },
    dispatch(req: object, res: object) {
      const next = vi.fn();
      captured!(req, res, next);
      return next;
    },
  };
}

function makeRes() {
  return {
    setHeader: vi.fn(),
    end: vi.fn(),
  };
}

// ─── configureServer (dev middleware) ─────────────────────────────────────────

describe('configureServer (dev middleware)', () => {

  it('registers a middleware on the server', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);
    expect(server.middlewares.use).toHaveBeenCalledOnce();
  });

  it('serves an existing icon with correct response headers', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    const res = makeRes();
    server.dispatch({ url: '/svg/add-outline.svg' }, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
  });

  it('strips the query string before resolving the icon path', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    const res = makeRes();
    server.dispatch({ url: '/svg/add-outline.svg?v=abc123' }, res);

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');
  });

  it('calls next() for a URL that does not start with /svg/', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    const next = server.dispatch({ url: '/assets/logo.png' }, makeRes());
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() for a /svg/ URL that is not an .svg file', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    const next = server.dispatch({ url: '/svg/icon.png' }, makeRes());
    expect(next).toHaveBeenCalledOnce();
  });

  it('calls next() when the requested icon does not exist in iconSrcDir', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    const next = server.dispatch({ url: '/svg/nonexistent-icon.svg' }, makeRes());
    expect(next).toHaveBeenCalledOnce();
  });

  it('respects a custom iconDestDir', () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG, iconDestDir: 'icons' });
    const server = makeServer();
    (plugin.configureServer as Function)(server);

    // /icons/ should match, /svg/ should not
    const res1 = makeRes();
    const next1 = server.dispatch({ url: '/icons/add-outline.svg' }, res1);
    expect(next1).not.toHaveBeenCalled();
    expect(res1.setHeader).toHaveBeenCalledWith('Content-Type', 'image/svg+xml');

    const next2 = server.dispatch({ url: '/svg/add-outline.svg' }, makeRes());
    expect(next2).toHaveBeenCalledOnce();
  });

});

// ─── generateBundle (build) ───────────────────────────────────────────────────

describe('generateBundle (build)', () => {

  async function runBuild(options: Parameters<typeof ionicIcons>[0] = {}) {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG, srcDir: FIXTURES_SRC, ...options });
    const emitted: Array<{ type: string; fileName: string; source: string }> = [];
    await (plugin.generateBundle as Function).call({ emitFile: (f: any) => emitted.push(f) });
    return emitted;
  }

  it('emits only icons detected in source files', async () => {
    const emitted = await runBuild();
    expect(emitted.length).toBeGreaterThan(0);
    expect(emitted.every(f => f.type === 'asset')).toBe(true);
    expect(emitted.every(f => f.fileName.startsWith('svg/'))).toBe(true);
    expect(emitted.every(f => f.fileName.endsWith('.svg'))).toBe(true);
  });

  it('emits all icons found across all fixture source files', async () => {
    const emitted = await runBuild();
    const names = emitted.map(f => f.fileName.replace('svg/', '').replace('.svg', ''));
    expect(names).toContain('add-outline');
    expect(names).toContain('trash');
    expect(names).toContain('home');
    expect(names).toContain('star');
    expect(names).toContain('arrow-back');
    expect(names).toContain('checkmark-circle');
    expect(names).toContain('close');
    expect(names).toContain('menu');
    expect(names).toContain('heart');
  });

  it('always emits extraIcons even if not found in source files', async () => {
    const emitted = await runBuild({ extraIcons: ['warning-outline'] });
    const names = emitted.map(f => f.fileName);
    expect(names).toContain('svg/warning-outline.svg');
  });

  it('does NOT emit icons that have no matching SVG file', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const emitted = await runBuild({ extraIcons: ['ghost-icon-xyz'] });
    const names = emitted.map(f => f.fileName);
    expect(names).not.toContain('svg/ghost-icon-xyz.svg');
    warnSpy.mockRestore();
  });

  it('logs a warning for each missing SVG file', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await runBuild({ extraIcons: ['ghost-icon-xyz'] });
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs detected icons and emit count in verbose mode', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runBuild({ verbose: true });
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });

  it('respects a custom iconDestDir in emitted file names', async () => {
    const emitted = await runBuild({ iconDestDir: 'icons' });
    expect(emitted.every(f => f.fileName.startsWith('icons/'))).toBe(true);
  });

  it('caches scan results — second call produces identical output', async () => {
    const plugin = ionicIcons({ iconSrcDir: FIXTURES_SVG, srcDir: FIXTURES_SRC });

    const emitted1: any[] = [];
    const emitted2: any[] = [];

    await (plugin.generateBundle as Function).call({ emitFile: (f: any) => emitted1.push(f) });
    await (plugin.generateBundle as Function).call({ emitFile: (f: any) => emitted2.push(f) });

    expect(emitted1.map(f => f.fileName).sort())
      .toEqual(emitted2.map(f => f.fileName).sort());
  });

  it('emits SVG source content (not empty)', async () => {
    const emitted = await runBuild();
    expect(emitted.every(f => typeof f.source === 'string' && f.source.length > 0)).toBe(true);
  });

});
