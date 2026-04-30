export class PluginEngine {
  constructor(pluginModules = []) {
    this.pluginModules = pluginModules;
  }

  getEnabled(pluginIds) {
    return this.pluginModules.filter((plugin) => pluginIds.has(plugin.id));
  }

  applyHook(hookName, initial, enabledPluginIds, context = {}) {
    return this.getEnabled(enabledPluginIds).reduce((value, plugin) => {
      if (typeof plugin[hookName] === 'function') {
        return plugin[hookName](value, context);
      }
      return value;
    }, initial);
  }

  getHookOutputs(hookName, enabledPluginIds, context = {}) {
    return this.getEnabled(enabledPluginIds)
      .map((plugin) => {
        if (typeof plugin[hookName] === 'function') {
          return plugin[hookName](context);
        }
        return null;
      })
      .filter((output) => output !== null && output !== undefined);
  }
}
