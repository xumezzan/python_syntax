// Python-песочница в Web Worker: вечный цикл вешает воркер, а не вкладку —
// главный поток по таймауту просто терминирует его.

const VERSION = '0.26.4';
const CDN = 'https://cdn.jsdelivr.net/pyodide/v' + VERSION + '/full/';

self.importScripts(CDN + 'pyodide.js');

const pyodideReady = self.loadPyodide({ indexURL: CDN }).then((py) => {
  self.postMessage({ ready: true });
  return py;
});

self.onmessage = async (e) => {
  const { id, code, stdin = [], files = [] } = e.data;
  const py = await pyodideReady;
  let out = '';
  const lines = [...stdin];

  py.setStdout({ batched: (s) => { out += s + '\n'; } });
  py.setStderr({ batched: (s) => { out += s + '\n'; } });
  py.setStdin({ stdin: () => (lines.length ? lines.shift() + '\n' : null) });

  for (const f of files) {
    try { py.FS.unlink(f.name); } catch (err) { /* файла не было */ }
    py.FS.writeFile(f.name, f.content);
  }

  const ns = py.globals.get('dict')();
  try {
    await py.runPythonAsync(code, { globals: ns });
    self.postMessage({ id, output: out, error: null });
  } catch (err) {
    self.postMessage({ id, output: out, error: String(err.message || err) });
  } finally {
    ns.destroy();
  }
};
