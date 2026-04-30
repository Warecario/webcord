import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { fetchChannels, fetchGuilds, fetchMessages } from './api/discordApi.js';
import { PluginEngine } from './pluginEngine.js';
import { pluginModules } from './pluginModules.jsx';
import { plugins, themes } from './themes.js';
import {
  restoreSavedExtensions,
  saveImportedExtensions,
  importPluginPackageFromUrl,
  importPluginPackageFromFile,
  importThemePackageFromUrl,
  importThemePackageFromFile,
  applyTheme
} from './extensionLoader.js';

const channelTypes = {
  text: 0,
  voice: 2
};

function formatTimestamp(timestamp) {
  try {
    return new Date(timestamp).toLocaleString();
  } catch {
    return timestamp;
  }
}

function normalizeMessage(message) {
  const authorName = message.author?.username || message.author?.name || 'Unknown';
  const content = message.content || (message.attachments?.length ? '[Attachment]' : '');
  const reactions = message.reactions?.map((reaction) => ({
    emoji: reaction.emoji?.name || reaction.emoji?.id || '❓',
    count: reaction.count
  })) || [];

  return {
    id: message.id,
    author: authorName,
    content,
    timestamp: formatTimestamp(message.timestamp || message.created_at || message.id),
    reactions,
    threadCount: message.thread?.location ? 1 : 0,
    raw: message
  };
}

function buildChannelList(channels) {
  return channels
    .filter((channel) => channel.type === channelTypes.text)
    .sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

function buildVoiceList(channels) {
  return channels.filter((channel) => channel.type === channelTypes.voice);
}

function DiscordLayout({ token, user, guilds, logout }) {
  const { guildId, channelId } = useParams();
  const navigate = useNavigate();
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState('');

  const guild = guilds.find((item) => item.id === guildId) || guilds[0];
  const [importedPlugins, setImportedPlugins] = useState([]);
  const [importedThemes, setImportedThemes] = useState([]);
  const [activeThemeId, setActiveThemeId] = useState(themes[0]?.id || '');
  const [pluginUrl, setPluginUrl] = useState('');
  const [themeUrl, setThemeUrl] = useState('');
  const [extensionError, setExtensionError] = useState('');

  const allThemes = useMemo(() => [...themes, ...importedThemes], [importedThemes]);
  const activeTheme = useMemo(() => allThemes.find((theme) => theme.id === activeThemeId) || allThemes[0], [allThemes, activeThemeId]);

  const combinedPluginModules = useMemo(() => [...pluginModules, ...importedPlugins], [importedPlugins]);
  const pluginEngine = useMemo(() => new PluginEngine(combinedPluginModules), [combinedPluginModules]);

  const allPlugins = useMemo(
    () => [...plugins, ...importedPlugins.map((plugin) => ({
      ...plugin,
      category: plugin.category || 'Imported'
    }))],
    [importedPlugins]
  );

  const pluginsByCategory = useMemo(() => {
    return allPlugins.reduce((groups, plugin) => {
      const category = plugin.category || 'Imported';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(plugin);
      return groups;
    }, {});
  }, [allPlugins]);

  const [enabledPlugins, setEnabledPlugins] = useState(() => new Set(plugins.filter((plugin) => plugin.enabledByDefault).map((plugin) => plugin.id)));

  useEffect(() => {
    setEnabledPlugins((current) => {
      const next = new Set(current);
      importedPlugins.forEach((plugin) => {
        if (!next.has(plugin.id) && plugin.enabledByDefault) {
          next.add(plugin.id);
        }
      });
      return next;
    });
  }, [importedPlugins]);

  const selectedChannel = channels.find((channel) => channel.id === channelId) || channels[0] || null;
  const voiceChannels = buildVoiceList(channels);
  const textChannels = buildChannelList(channels);

  useEffect(() => {
    if (activeTheme) {
      applyTheme(activeTheme);
    }
  }, [activeTheme]);

  useEffect(() => {
    let mounted = true;
    restoreSavedExtensions()
      .then(({ plugins: restoredPlugins, themes: restoredThemes }) => {
        if (!mounted) {
          return;
        }
        if (restoredPlugins.length) {
          setImportedPlugins(restoredPlugins);
        }
        if (restoredThemes.length) {
          setImportedThemes(restoredThemes);
          if (!activeThemeId) {
            setActiveThemeId(restoredThemes[0].id);
          }
        }
      })
      .catch((restoreError) => {
        console.warn('Unable to restore imported extensions', restoreError);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const saveExtensionState = (nextPlugins, nextThemes) => {
    saveImportedExtensions({ plugins: nextPlugins, themes: nextThemes });
  };

  const handlePluginImportUrl = async () => {
    setExtensionError('');
    try {
      const plugin = await importPluginPackageFromUrl(pluginUrl);
      const nextPlugins = [...importedPlugins.filter((item) => item.id !== plugin.id), plugin];
      setImportedPlugins(nextPlugins);
      saveExtensionState(nextPlugins, importedThemes);
      setPluginUrl('');
    } catch (importError) {
      setExtensionError(importError.message || 'Unable to import plugin.');
    }
  };

  const handleThemeImportUrl = async () => {
    setExtensionError('');
    try {
      const theme = await importThemePackageFromUrl(themeUrl);
      const nextThemes = [...importedThemes.filter((item) => item.id !== theme.id), theme];
      setImportedThemes(nextThemes);
      saveExtensionState(importedPlugins, nextThemes);
      setThemeUrl('');
      setActiveThemeId(theme.id);
    } catch (importError) {
      setExtensionError(importError.message || 'Unable to import theme.');
    }
  };

  const handlePluginFileChange = async (event) => {
    setExtensionError('');
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const plugin = await importPluginPackageFromFile(file);
      const nextPlugins = [...importedPlugins.filter((item) => item.id !== plugin.id), plugin];
      setImportedPlugins(nextPlugins);
      saveExtensionState(nextPlugins, importedThemes);
      event.target.value = '';
    } catch (importError) {
      setExtensionError(importError.message || 'Unable to import plugin file.');
    }
  };

  const handleThemeFileChange = async (event) => {
    setExtensionError('');
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const theme = await importThemePackageFromFile(file);
      const nextThemes = [...importedThemes.filter((item) => item.id !== theme.id), theme];
      setImportedThemes(nextThemes);
      saveExtensionState(importedPlugins, nextThemes);
      setActiveThemeId(theme.id);
      event.target.value = '';
    } catch (importError) {
      setExtensionError(importError.message || 'Unable to import theme file.');
    }
  };

  useEffect(() => {
    if (!guild || !token) {
      return;
    }

    setLoadingChannels(true);
    fetchChannels(guild.id, token)
      .then((items) => {
        setChannels(items);
        setError('');
      })
      .catch((fetchError) => {
        setError(fetchError.message);
      })
      .finally(() => {
        setLoadingChannels(false);
      });
  }, [guild, token]);

  useEffect(() => {
    if (!selectedChannel || !token) {
      return;
    }

    setLoadingMessages(true);
    fetchMessages(selectedChannel.id, token)
      .then((items) => {
        setMessages(items.map(normalizeMessage));
        setError('');
      })
      .catch((fetchError) => {
        setError(fetchError.message);
      })
      .finally(() => {
        setLoadingMessages(false);
      });
  }, [selectedChannel, token]);

  useEffect(() => {
    if (!channelId && textChannels.length > 0) {
      navigate(`/server/${guild.id}/channel/${textChannels[0].id}`, { replace: true });
    }
  }, [channelId, guild, navigate, textChannels]);

  const togglePlugin = (pluginId) => {
    setEnabledPlugins((previous) => {
      const next = new Set(previous);
      if (next.has(pluginId)) {
        next.delete(pluginId);
      } else {
        next.add(pluginId);
      }
      return next;
    });
  };

  const callWidgets = pluginEngine.getHookOutputs('renderCallStatus', enabledPlugins, {
    server: guild,
    channel: selectedChannel
  });
  const botWidgets = pluginEngine.getHookOutputs('renderBotPanel', enabledPlugins, {
    server: guild,
    channel: selectedChannel
  });
  const serverStatusWidget = pluginEngine.getHookOutputs('renderServerStatus', enabledPlugins, {
    server: guild
  })[0];
  const threadWidgets = pluginEngine.getHookOutputs('renderThreadPreview', enabledPlugins, {
    channel: selectedChannel
  });

  if (!guild) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell">
      <aside className="sidebar sidebar-servers">
        <div className="brand">W</div>
        <div className="server-list">
          {guilds.map((item) => (
            <div key={item.id} className="server-icon-wrap">
              <Link
                to={`/server/${item.id}`}
                className={`server-icon ${item.id === guild.id ? 'active' : ''}`}
              >
                {item.name[0]}
              </Link>
              {serverStatusWidget && item.id === guild.id && serverStatusWidget}
            </div>
          ))}
        </div>
      </aside>

      <aside className="sidebar sidebar-channels">
        <div className="server-header">
          <div>
            <div className="server-name">{guild.name}</div>
            <div className="server-subtitle">Server ID {guild.id}</div>
          </div>
        </div>

        <div className="account-banner">
          <div>
            <strong>{user?.username || 'Discord User'}</strong>
            <div className="plugin-description">Logged in with Discord</div>
          </div>
          <button type="button" className="plugin-toggle" onClick={logout}>
            Sign out
          </button>
        </div>

        <div className="settings-card">
          <div className="settings-label">Theme</div>
          <select value={activeThemeId} onChange={(event) => setActiveThemeId(event.target.value)}>
            {allThemes.map((theme) => (
              <option key={theme.id} value={theme.id}>
                {theme.name}
              </option>
            ))}
          </select>
          <div className="settings-subtitle">Switch Discord display themes or import a BetterDiscord/Vencord theme.</div>
        </div>

        <div className="settings-card import-panel">
          <div className="settings-label">Import plugin or theme</div>
          <input
            type="text"
            className="import-field"
            placeholder="Plugin URL, ZIP URL, or raw package URL"
            value={pluginUrl}
            onChange={(event) => setPluginUrl(event.target.value)}
          />
          <button type="button" className="import-action" onClick={handlePluginImportUrl}>
            Import plugin
          </button>
          <input type="file" accept=".js,.json,.plugin,.zip" className="import-field" onChange={handlePluginFileChange} />
          <input
            type="text"
            className="import-field"
            placeholder="Theme URL, ZIP URL, or raw theme URL"
            value={themeUrl}
            onChange={(event) => setThemeUrl(event.target.value)}
          />
          <button type="button" className="import-action" onClick={handleThemeImportUrl}>
            Import theme
          </button>
          <input type="file" accept=".css,.json,.theme,.zip" className="import-field" onChange={handleThemeFileChange} />
          {extensionError && <div className="auth-error">{extensionError}</div>}
        </div>

        <div className="settings-card plugin-panel">
          <div className="settings-label">Plugin and feature toggles</div>
          {Object.entries(pluginsByCategory).map(([category, items]) => (
            <div key={category} className="plugin-group">
              <div className="plugin-group-title">{category}</div>
              {items.map((plugin) => (
                <button
                  key={plugin.id}
                  type="button"
                  className={`plugin-toggle ${enabledPlugins.has(plugin.id) ? 'enabled' : ''}`}
                  onClick={() => togglePlugin(plugin.id)}
                >
                  <div>
                    <strong>{plugin.name}</strong>
                    <div className="plugin-description">{plugin.description}</div>
                  </div>
                  <span>{enabledPlugins.has(plugin.id) ? 'ON' : 'OFF'}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="channel-group">
          <div className="group-label">TEXT CHANNELS</div>
          {loadingChannels && <div className="plugin-description">Loading channels…</div>}
          {textChannels.map((channelItem) => (
            <div key={channelItem.id} className="channel-link-wrap">
              <Link
                to={`/server/${guild.id}/channel/${channelItem.id}`}
                className={`channel-link ${channelItem.id === selectedChannel?.id ? 'selected' : ''}`}
              >
                <span className="channel-hash">#</span>
                <span>{channelItem.name}</span>
                <span className="channel-id small">{channelItem.id}</span>
              </Link>
            </div>
          ))}
        </div>

        {voiceChannels.length > 0 && (
          <div className="channel-group">
            <div className="group-label">VOICE CHANNELS</div>
            {voiceChannels.map((channelItem) => (
              <div key={channelItem.id} className="channel-link-wrap">
                <div className="channel-link">
                  <span className="channel-hash">🎤</span>
                  <span>{channelItem.name}</span>
                  <span className="channel-id small">{channelItem.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="content-panel">
        <div className="channel-topbar">
          <div>
            <span className="channel-hash">#</span>
            <span className="channel-title">{selectedChannel?.name || 'Loading channel…'}</span>
          </div>
          <div className="channel-meta">
            Channel ID: {selectedChannel?.id || '—'}
          </div>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {callWidgets}
        {botWidgets}

        <div className={`message-area ${selectedChannel ? '' : 'compact'}`}>
          {loadingMessages && <div className="plugin-description">Loading messages…</div>}
          {messages.map((message) => {
            const messageText = pluginEngine.applyHook(
              'formatMessageContent',
              message.content,
              enabledPlugins,
              { message, channel: selectedChannel }
            );
            const messageReactions = pluginEngine.getHookOutputs('renderMessageReactions', enabledPlugins, {
              message
            });
            return (
              <div key={message.id} className="message-row">
                <div className="message-avatar">{message.author.slice(0, 2).toUpperCase()}</div>
                <div className="message-body">
                  <div className="message-header">
                    <span className="message-author">{message.author}</span>
                    <span className="message-timestamp">{message.timestamp}</span>
                  </div>
                  <div className="message-content">{messageText}</div>
                  {messageReactions}
                </div>
              </div>
            );
          })}
        </div>

        {threadWidgets}

        <div className="message-input">
          <input disabled={!selectedChannel} placeholder={selectedChannel ? `Message #${selectedChannel.name}` : 'Select a channel to start'} />
        </div>
      </main>
    </div>
  );
}

export default function DiscordClient({ token, user, logout }) {
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    setLoading(true);
    fetchGuilds(token)
      .then((items) => {
        setGuilds(items);
        setError('');
      })
      .catch((fetchError) => {
        setError(fetchError.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return <div className="auth-page"><div className="auth-card"><h1>Loading your Discord servers…</h1></div></div>;
  }

  if (error) {
    return <div className="auth-page"><div className="auth-card"><h1>Discord API error</h1><div className="auth-error">{error}</div></div></div>;
  }

  if (!guilds.length) {
    return <div className="auth-page"><div className="auth-card"><h1>No Discord servers found</h1><p>Make sure your account is in at least one server.</p></div></div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/server/${guilds[0].id}`} replace />} />
      <Route path="/server/:guildId/channel/:channelId" element={<DiscordLayout token={token} user={user} guilds={guilds} logout={logout} />} />
      <Route path="/server/:guildId" element={<DiscordLayout token={token} user={user} guilds={guilds} logout={logout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
