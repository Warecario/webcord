export const DISCORD_CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID || '';
export const DISCORD_SCOPES = ['identify', 'guilds', 'messages.read'].join(' ');

export function getDiscordRedirectUri() {
  return `${window.location.origin}${window.location.pathname}`;
}
