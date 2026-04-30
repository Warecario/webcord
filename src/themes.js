export const themes = [
  {
    id: 'discord-dark',
    name: 'Discord Dark',
    vars: {
      '--bg': '#0f1419',
      '--surface': '#111b26',
      '--surface-strong': '#17212d',
      '--sidebar': '#0f1217',
      '--sidebar-strong': '#111b26',
      '--text': '#e8eff8',
      '--muted': '#8a99ab',
      '--accent': '#5865f2',
      '--accent-strong': '#4752c4',
      '--border': 'rgba(255,255,255,0.08)',
      '--shadow': '0 20px 80px rgba(0,0,0,.35)'
    }
  },
  {
    id: 'better-night',
    name: 'BetterDiscord Night',
    vars: {
      '--bg': '#0b1320',
      '--surface': '#121d2a',
      '--surface-strong': '#1c2938',
      '--sidebar': '#09101a',
      '--sidebar-strong': '#101c2a',
      '--text': '#f0f7ff',
      '--muted': '#9fb2c0',
      '--accent': '#9c7cfa',
      '--accent-strong': '#7b5df0',
      '--border': 'rgba(255,255,255,0.11)',
      '--shadow': '0 22px 72px rgba(0,0,0,.36)'
    }
  },
  {
    id: 'vencord-neon',
    name: 'Vencord Neon',
    vars: {
      '--bg': '#07090f',
      '--surface': '#0c1423',
      '--surface-strong': '#142041',
      '--sidebar': '#081020',
      '--sidebar-strong': '#0d1b36',
      '--text': '#edeff2',
      '--muted': '#9ca6b6',
      '--accent': '#1ae3ff',
      '--accent-strong': '#0bb7dc',
      '--border': 'rgba(255,255,255,0.12)',
      '--shadow': '0 24px 88px rgba(0,0,0,.4)'
    }
  }
];

export const plugins = [
  {
    id: 'compact-mode',
    name: 'Compact Mode',
    description: 'Reduce spacing and show more messages in chat.',
    enabledByDefault: false
  },
  {
    id: 'auto-dark',
    name: 'Auto Dark Mode',
    description: 'Force the Discord dark theme for a Vencord-style experience.',
    enabledByDefault: false
  },
  {
    id: 'show-timestamps',
    name: 'Show Timestamps',
    description: 'Display extra activity metadata in the top bar.',
    enabledByDefault: true
  },
  {
    id: 'server-badges',
    name: 'Server Badges',
    description: 'Show custom server badges next to server icons.',
    enabledByDefault: true
  }
];
