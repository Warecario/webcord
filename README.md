# webcord

A Discord-style web app shell with BetterDiscord/Vencord-style theme and plugin support built on React + Vite.

This project is being built as a true web-native Discord experience: real guilds, voice, bots, plugins, themes, and extensible UI behavior.

## What is included

- Discord-like server list, channel list, and chat panel
- Server and channel hover cards showing real-looking IDs
- Theme switching with custom CSS variables
- Plugin architecture for custom Webcord plugins
- Importable BetterDiscord / Vencord style plugins and themes
- Built-in plugin categories for appearance, chat, bots, and voice
- Routeable URLs for `server/:serverId/channel/:channelId`
- GitHub Pages deployment support

## Install

```bash
npm install
```

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Environment

Copy `.env.example` into `.env` and set your Discord OAuth client ID:

```bash
cp .env.example .env
```

Then open `.env` and set:

```bash
VITE_DISCORD_CLIENT_ID=YOUR_DISCORD_APP_CLIENT_ID
```

## How to use

- Open the site and click **Continue with Discord**
- Authorize with your Discord account
- Webcord will load your servers, channels, and messages
- Hover servers and channels to see real-looking IDs
- Toggle plugin-style features for custom Webcord behavior
- Use the import section to load BetterDiscord/Vencord theme and plugin ZIP packages or raw files from URL or file
- Imported plugins and themes persist in your browser profile via localStorage

## Architecture

- `src/pluginEngine.js` provides a plugin hook system
- `src/extensionLoader.js` supports imported plugin and theme packages
- `src/pluginModules.jsx` defines fallback plugin behavior
- `src/plugins.js` exposes plugin metadata for the UI
- `src/api/discordApi.js` is the placeholder surface for Discord OAuth/Gateway/API integration

## Next steps

- Add Discord OAuth and Gateway integration for real servers and messages
- Support actual voice calls and media sessions
- Build a full plugin loader for user-created Webcord plugins
- Add direct messages, server settings, roles, and bot command handling
