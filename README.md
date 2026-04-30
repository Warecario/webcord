# webcord

A Discord-style web app shell with BetterDiscord/Vencord-style theme and plugin support built on React + Vite.

This project is being built as a true web-native Discord experience: real guilds, voice, bots, plugins, themes, and extensible UI behavior.

## What is included

- Discord-like server list, channel list, and chat panel
- Server and channel hover cards showing real-looking IDs
- Theme switching with custom CSS variables
- Plugin architecture for custom Webcord plugins
- Built-in plugin categories for appearance, chat, bots, and voice
- Routeable URLs for `server/:serverId/channel/:channelId`
- GitHub Pages deployment support

## Install

```bash
npm install
```

## Run locally

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Deploy to GitHub Pages

```bash
npm run deploy
```

## How to use

- Click servers in the left sidebar
- Click channels in the middle panel
- Hover servers and channels to see IDs
- Pick a theme from the theme dropdown
- Toggle plugin features for compact mode, reactions, emoji rendering, voice call panels, and bot panels

## Architecture

- `src/pluginEngine.js` provides a plugin hook system
- `src/pluginModules.jsx` defines plugin behavior
- `src/plugins.js` exposes plugin metadata for the UI
- `src/api/discordApi.js` is the placeholder surface for Discord OAuth/Gateway/API integration

## Next steps

- Add Discord OAuth and Gateway integration for real servers and messages
- Support actual voice calls and media sessions
- Build a full plugin loader for user-created Webcord plugins
- Add direct messages, server settings, roles, and bot command handling
