// Test-only: lets plain Node load the app's modules, which import siblings without ".js" (Next resolves them).
import { registerHooks } from 'node:module';
registerHooks({
  resolve(specifier, context, nextResolve) {
    try { return nextResolve(specifier, context); } catch (err) {
      if (err?.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier) && !/\.[cm]?js$/.test(specifier)) return nextResolve(specifier + '.js', context);
      throw err;
    }
  },
});
