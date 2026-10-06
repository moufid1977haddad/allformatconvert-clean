// Lets plain Node load the app's ES modules, which import siblings without the ".js" extension (Next resolves
// them; Node does not). Usage: node --import ./scripts/p37/ext-loader.mjs <test>. Test-only, never shipped.
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (err) {
      if (err?.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier) && !/\.[cm]?js$/.test(specifier)) {
        return nextResolve(specifier + '.js', context);
      }
      throw err;
    }
  },
});
