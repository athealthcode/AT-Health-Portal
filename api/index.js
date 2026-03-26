// Debug wrapper — exposes actual startup/handler error in response
let _fn;
try {
  const _mod = require('../dist/index.cjs');
  _fn = _mod.default || _mod;
} catch (loadErr) {
  console.error('[api] module load failed:', loadErr);
  _fn = (_req, res) => res.status(500).json({ phase: 'load', error: String(loadErr) });
}

module.exports = async (req, res) => {
  try {
    await _fn(req, res);
  } catch (handlerErr) {
    console.error('[api] handler error:', handlerErr);
    if (!res.headersSent) {
      res.status(500).json({ phase: 'handler', error: String(handlerErr), stack: handlerErr?.stack });
    }
  }
};
