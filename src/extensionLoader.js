import JSZip from 'jszip';

const STORAGE_KEY = 'webcord_imported_extensions_v2';
const THEME_STYLE_ID = 'webcord-imported-theme-style';

function getExtension(name) {
  return name.split('.').pop().toLowerCase();
}

async function parseZipEntries(file) {
  const zip = await JSZip.loadAsync(file);
  const entries = [];
  await Promise.all(
    Object.values(zip.files).map(async (entry) => {
      if (entry.dir) {
        return;
      }
      const content = await entry.async('string');
      entries.push({ path: entry.name, name: entry.name.split('/').pop(), content });
    })
  );
  return entries;
}

function findZipPluginEntry(entries) {
  return (
    entries.find((entry) => /(^|\/)plugin\.js$/i.test(entry.path)) ||
    entries.find((entry) => /(^|\/)index\.js$/i.test(entry.path)) ||
    entries.find((entry) => /(^|\/)main\.js$/i.test(entry.path)) ||
    entries.find((entry) => /\.plugin\.js$/i.test(entry.name)) ||
    entries.find((entry) => /\.js$/i.test(entry.name))
  );
}

function findZipThemeEntry(entries) {
  return (
    entries.find((entry) => /\.theme\.css$/i.test(entry.name)) ||
    entries.find((entry) => /\.css$/i.test(entry.name))
  );
}

async function buildPluginFromZipEntries(entries, source) {
  const pluginFile = findZipPluginEntry(entries);
  if (!pluginFile) {
    throw new Error('No plugin JS file found in zip.');
  }
  const module = await importJsModuleFromText(pluginFile.content, pluginFile.path);
  const plugin = module.default || module.plugin || module;
  return {
    ...normalizePluginPackage(plugin, source),
    rawText: pluginFile.content,
    source,
    zipFiles: entries
  };
}

async function buildThemeFromZipEntries(entries, source) {
  const themeFile = findZipThemeEntry(entries);
  if (!themeFile) {
    throw new Error('No theme CSS file found in zip.');
  }
  const theme = parseThemeText(themeFile.content, source, 'css');
  return {
    ...theme,
    rawText: themeFile.content,
    css: themeFile.content,
    source,
    zipFiles: entries
  };
}

async function importPluginPackageFromZipUrl(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch plugin ZIP from ${sourceUrl}`);
  }
  const blob = await response.blob();
  const entries = await parseZipEntries(blob);
  return buildPluginFromZipEntries(entries, sourceUrl);
}

async function importThemePackageFromZipUrl(sourceUrl) {
  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch theme ZIP from ${sourceUrl}`);
  }
  const blob = await response.blob();
  const entries = await parseZipEntries(blob);
  return buildThemeFromZipEntries(entries, sourceUrl);
}

function normalizePluginPackage(plugin, source) {
  if (!plugin || !plugin.id) {
    throw new Error('Imported plugin package must export an object with an `id` field.');
  }

  return {
    id: plugin.id,
    name: plugin.name || plugin.id,
    description: plugin.description || 'Imported plugin package',
    category: plugin.category || 'Imported',
    enabledByDefault: plugin.enabledByDefault ?? false,
    source: source || plugin.source || 'imported',
    ...plugin
  };
}

function normalizeThemePackage(theme, source) {
  if (!theme || !theme.id) {
    throw new Error('Imported theme package must contain an `id` field.');
  }

  return {
    id: theme.id,
    name: theme.name || theme.id,
    vars: theme.vars || {},
    css: theme.css || '',
    source: source || theme.source || 'imported',
    enabledByDefault: theme.enabledByDefault ?? false,
    ...theme
  };
}

async function importJsModuleFromText(rawText, sourceName) {
  const blob = new Blob([rawText], { type: 'text/javascript' });
  const url = URL.createObjectURL(blob);
  try {
    const module = await import(/* @vite-ignore */ url);
    return module;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function importPluginPackageFromUrl(sourceUrl) {
  const extension = getExtension(sourceUrl);
  if (extension === 'zip') {
    return importPluginPackageFromZipUrl(sourceUrl);
  }

  const module = await import(/* @vite-ignore */ sourceUrl);
  const plugin = module.default || module.plugin || module;
  return normalizePluginPackage(plugin, sourceUrl);
}

async function importPluginPackageFromFile(file) {
  const extension = getExtension(file.name);
  if (extension === 'zip') {
    return importPluginPackageFromZipFile(file);
  }

  const text = await file.text();
  if (extension === 'json') {
    const plugin = JSON.parse(text);
    return {
      ...normalizePluginPackage(plugin, file.name),
      rawText: text
    };
  }

  const module = await importJsModuleFromText(text, file.name);
  const plugin = module.default || module.plugin || module;
  return {
    ...normalizePluginPackage(plugin, file.name),
    rawText: text
  };
}

async function importThemePackageFromUrl(sourceUrl) {
  const extension = getExtension(sourceUrl);
  if (extension === 'zip') {
    return importThemePackageFromZipUrl(sourceUrl);
  }

  const response = await fetch(sourceUrl);
  if (!response.ok) {
    throw new Error(`Unable to fetch theme package from ${sourceUrl}`);
  }
  const text = await response.text();
  return parseThemeText(text, sourceUrl, extension);
}

async function importThemePackageFromFile(file) {
  const extension = getExtension(file.name);
  if (extension === 'zip') {
    return importThemePackageFromZipFile(file);
  }

  const text = await file.text();
  const theme = parseThemeText(text, file.name, extension);
  return { ...theme, rawText: text };
}

async function importPluginPackageFromZipFile(file) {
  const entries = await parseZipEntries(file);
  return buildPluginFromZipEntries(entries, file.name);
}

async function importThemePackageFromZipFile(file) {
  const entries = await parseZipEntries(file);
  return buildThemeFromZipEntries(entries, file.name);
}

function parseThemeText(text, source, extension) {
  if (extension === 'json') {
    const theme = JSON.parse(text);
    return normalizeThemePackage(theme, source);
  }

  const vars = {};
  const regex = /--([\w-]+)\s*:\s*([^;]+);/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    vars[`--${match[1]}`] = match[2].trim();
  }

  return normalizeThemePackage({
    id: `imported-theme-${Math.random().toString(36).slice(2, 10)}`,
    name: `Imported Theme ${source}`,
    vars,
    css: text
  }, source);
}

export async function restoreSavedExtensions() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { plugins: [], themes: [] };
  }

  try {
    const { plugins = [], themes = [] } = JSON.parse(stored);
    const loadedPlugins = [];
    const loadedThemes = [];

    for (const plugin of plugins) {
      try {
        if (plugin.sourceUrl) {
          try {
            loadedPlugins.push(await importPluginPackageFromUrl(plugin.sourceUrl));
            continue;
          } catch (remoteError) {
            console.warn('Remote plugin URL failed, falling back to saved ZIP/raw data:', plugin.sourceUrl, remoteError);
          }
        }

        if (plugin.rawText) {
          const module = await importJsModuleFromText(plugin.rawText, plugin.name || 'imported-plugin');
          const resolved = module.default || module.plugin || module;
          loadedPlugins.push({
            ...normalizePluginPackage(resolved, plugin.source || plugin.name),
            rawText: plugin.rawText,
            zipFiles: plugin.zipFiles || []
          });
          continue;
        }

        if (plugin.zipFiles?.length) {
          const pluginEntry = findZipPluginEntry(plugin.zipFiles);
          if (!pluginEntry) {
            throw new Error('Plugin ZIP contents are missing a valid entry point.');
          }
          const module = await importJsModuleFromText(pluginEntry.content, pluginEntry.path);
          const resolved = module.default || module.plugin || module;
          loadedPlugins.push({
            ...normalizePluginPackage(resolved, plugin.source || plugin.name),
            rawText: pluginEntry.content,
            zipFiles: plugin.zipFiles
          });
          continue;
        }
      } catch (error) {
        console.warn('Failed to restore imported plugin:', plugin.id, error);
      }
    }

    for (const theme of themes) {
      try {
        if (theme.sourceUrl) {
          loadedThemes.push(await importThemePackageFromUrl(theme.sourceUrl));
        } else if (theme.rawText) {
          loadedThemes.push({
            ...parseThemeText(theme.rawText, theme.source || theme.name, 'css'),
            rawText: theme.rawText,
            css: theme.css,
            zipFiles: theme.zipFiles || []
          });
          continue;
        } else if (theme.zipFiles?.length) {
          const themeEntry = findZipThemeEntry(theme.zipFiles);
          if (!themeEntry) {
            throw new Error('Theme ZIP contents are missing a CSS entry point.');
          }
          loadedThemes.push({
            ...parseThemeText(themeEntry.content, themeEntry.path, 'css'),
            rawText: themeEntry.content,
            css: themeEntry.content,
            zipFiles: theme.zipFiles
          });
        }
      } catch (error) {
        console.warn('Failed to restore imported theme:', theme.id, error);
      }
    }

    return { plugins: loadedPlugins, themes: loadedThemes };
  } catch (error) {
    console.warn('Unable to parse saved extensions', error);
    return { plugins: [], themes: [] };
  }
}

export function saveImportedExtensions({ plugins = [], themes = [] }) {
  const payload = {
    plugins: plugins.map((plugin) => ({
      id: plugin.id,
      name: plugin.name,
      description: plugin.description,
      category: plugin.category,
      enabledByDefault: plugin.enabledByDefault,
      sourceUrl: plugin.source?.startsWith('http') ? plugin.source : undefined,
      rawText: plugin.source && !plugin.source.startsWith('http') ? plugin.rawText : undefined,
      zipFiles: plugin.zipFiles?.map((entry) => ({ path: entry.path, content: entry.content })),
      source: plugin.source
    })),
    themes: themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      vars: theme.vars,
      css: theme.css,
      sourceUrl: theme.source?.startsWith('http') ? theme.source : undefined,
      rawText: theme.source && !theme.source.startsWith('http') ? theme.rawText : undefined,
      zipFiles: theme.zipFiles?.map((entry) => ({ path: entry.path, content: entry.content })),
      source: theme.source
    }))
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export { importPluginPackageFromUrl, importPluginPackageFromFile, importThemePackageFromUrl, importThemePackageFromFile };

export function applyTheme(theme) {
  const existing = document.getElementById(THEME_STYLE_ID);
  if (existing) {
    existing.remove();
  }

  if (theme?.css) {
    const style = document.createElement('style');
    style.id = THEME_STYLE_ID;
    style.textContent = theme.css;
    document.head.appendChild(style);
    return;
  }

  const root = document.documentElement;
  Object.entries(theme.vars || {}).forEach(([key, value]) => root.style.setProperty(key, value));
}
