import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { defaultChannelId, defaultServerId, findChannel, findServer, servers } from './data.js';
import { plugins, themes } from './themes.js';
import { PluginEngine } from './pluginEngine.js';
import { pluginModules } from './pluginModules.jsx';

function groupPluginsByCategory(pluginList) {
  return pluginList.reduce((groups, plugin) => {
    const category = plugin.category || 'Other';
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(plugin);
    return groups;
  }, {});
}

function ServerLayout() {
  const { serverId, channelId } = useParams();
  const [selectedThemeId, setSelectedThemeId] = useState(themes[0].id);
  const [enabledPlugins, setEnabledPlugins] = useState(
    () => plugins.filter((plugin) => plugin.enabledByDefault).map((plugin) => plugin.id)
  );
  const [hoveredServerId, setHoveredServerId] = useState(null);
  const [hoveredChannelId, setHoveredChannelId] = useState(null);

  const pluginEngine = useMemo(() => new PluginEngine(pluginModules), []);
  const pluginsByCategory = useMemo(() => groupPluginsByCategory(plugins), []);
  const server = useMemo(() => findServer(serverId) || findServer(defaultServerId), [serverId]);
  const channel = useMemo(
    () => findChannel(server.id, channelId) || server.channels[0],
    [server, channelId, server]
  );
  const theme = useMemo(
    () => themes.find((item) => item.id === selectedThemeId) || themes[0],
    [selectedThemeId]
  );
  const enabledPluginSet = useMemo(() => new Set(enabledPlugins), [enabledPlugins]);
  const activeTheme = enabledPluginSet.has('auto-dark')
    ? themes.find((item) => item.id === 'discord-dark') || theme
    : theme;
  const themeVars = pluginEngine.applyHook('modifyThemeVars', activeTheme.vars, enabledPluginSet, {
    server,
    channel
  });

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([key, value]) => root.style.setProperty(key, value));
  }, [themeVars]);

  const togglePlugin = (pluginId) => {
    setEnabledPlugins((previous) => {
      return previous.includes(pluginId)
        ? previous.filter((id) => id !== pluginId)
        : [...previous, pluginId];
    });
  };

  const compactMode = enabledPluginSet.has('compact-mode');
  const showTimestamps = enabledPluginSet.has('show-timestamps');
  const serverBadges = enabledPluginSet.has('server-badges');

  const callWidgets = pluginEngine.getHookOutputs('renderCallStatus', enabledPluginSet, {
    server,
    channel
  });
  const botWidgets = pluginEngine.getHookOutputs('renderBotPanel', enabledPluginSet, {
    server,
    channel
  });
  const serverStatusWidget = pluginEngine.getHookOutputs('renderServerStatus', enabledPluginSet, {
    server
  })[0];
  const threadWidgets = pluginEngine.getHookOutputs('renderThreadPreview', enabledPluginSet, {
    channel
  });

  return (
    <div className="app-shell">
      <aside className="sidebar sidebar-servers">
        <div className="brand">W</div>
        <div className="server-list">
          {servers.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredServerId(item.id)}
              onMouseLeave={() => setHoveredServerId(null)}
              className="server-icon-wrap"
            >
              <Link
                to={`/server/${item.id}/channel/${item.channels[0].id}`}
                className={`server-icon ${item.id === server.id ? 'active' : ''}`}
              >
                {item.icon}
                {serverBadges && <span className="server-badge">B</span>}
              </Link>
              {serverStatusWidget && item.id === server.id && serverStatusWidget}
              {hoveredServerId === item.id && (
                <div className="hover-card hover-card-left">
                  <div className="hover-card-title">{item.name}</div>
                  <div className="hover-card-row">
                    <span>ID</span>
                    <code>{item.id}</code>
                  </div>
                  <div className="hover-card-row">
                    <span>Channels</span>
                    <code>{item.channels.length}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <aside className="sidebar sidebar-channels">
        <div className="server-header">
          <div>
            <div className="server-name">{server.name}</div>
            <div className="server-subtitle">Server ID {server.id}</div>
          </div>
        </div>

        <div className="settings-card">
          <div className="settings-label">Theme</div>
          <select
            value={selectedThemeId}
            onChange={(event) => setSelectedThemeId(event.target.value)}
          >
            {themes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="settings-subtitle">BetterDiscord + Vencord ready</div>
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
                  className={`plugin-toggle ${enabledPluginSet.has(plugin.id) ? 'enabled' : ''}`}
                  onClick={() => togglePlugin(plugin.id)}
                >
                  <div>
                    <strong>{plugin.name}</strong>
                    <div className="plugin-description">{plugin.description}</div>
                  </div>
                  <span>{enabledPluginSet.has(plugin.id) ? 'ON' : 'OFF'}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        <div className="channel-group">
          <div className="group-label">TEXT CHANNELS</div>
          {server.channels.map((channelItem) => (
            <div
              key={channelItem.id}
              className="channel-link-wrap"
              onMouseEnter={() => setHoveredChannelId(channelItem.id)}
              onMouseLeave={() => setHoveredChannelId(null)}
            >
              <Link
                to={`/server/${server.id}/channel/${channelItem.id}`}
                className={`channel-link ${channelItem.id === channel.id ? 'selected' : ''}`}
              >
                <span className="channel-hash">#</span>
                <span>{channelItem.name}</span>
                <span className="channel-id small">{channelItem.id}</span>
              </Link>
              {hoveredChannelId === channelItem.id && (
                <div className="hover-card hover-card-right">
                  <div className="hover-card-title">Text channel</div>
                  <div className="hover-card-row">
                    <span>Name</span>
                    <code>#{channelItem.name}</code>
                  </div>
                  <div className="hover-card-row">
                    <span>ID</span>
                    <code>{channelItem.id}</code>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main className="content-panel">
        <div className="channel-topbar">
          <div>
            <span className="channel-hash">#</span>
            <span className="channel-title">{channel.name}</span>
          </div>
          <div className="channel-meta">
            Channel ID: {channel.id}
            {showTimestamps && (
              <>
                <span className="dot">•</span>
                <span>Last active 2m ago</span>
              </>
            )}
          </div>
        </div>

        {callWidgets}
        {botWidgets}

        <div className={`message-area ${compactMode ? 'compact' : ''}`}>
          {channel.messages.map((message) => {
            const messageText = pluginEngine.applyHook(
              'formatMessageContent',
              message.content,
              enabledPluginSet,
              { message, channel }
            );
            const messageReactions = pluginEngine.getHookOutputs('renderMessageReactions', enabledPluginSet, {
              message
            });
            return (
              <div key={message.id} className={`message-row ${compactMode ? 'compact' : ''}`}>
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

        <div className={`message-input ${compactMode ? 'compact' : ''}`}>
          <input placeholder={`Message #${channel.name}`} />
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Navigate to={`/server/${defaultServerId}/channel/${defaultChannelId}`} replace />}
      />
      <Route path="/server/:serverId/channel/:channelId" element={<ServerLayout />} />
      <Route path="/server/:serverId" element={<ServerLayout />} />
      <Route
        path="*"
        element={<Navigate to={`/server/${defaultServerId}/channel/${defaultChannelId}`} replace />}
      />
    </Routes>
  );
}
