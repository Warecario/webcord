export const plugins = [
  {
    id: 'compact-mode',
    name: 'Compact Mode',
    description: 'Reduce spacing and show more messages in the chat feed.',
    category: 'Appearance',
    enabledByDefault: false
  },
  {
    id: 'auto-dark',
    name: 'Auto Dark Mode',
    description: 'Always use the Discord dark theme regardless of selection.',
    category: 'Appearance',
    enabledByDefault: false
  },
  {
    id: 'custom-emojis',
    name: 'Custom Emojis',
    description: 'Render emoji shortcodes like :tada: and :fire:.',
    category: 'Chat',
    enabledByDefault: true
  },
  {
    id: 'reactions-preview',
    name: 'Message Reactions',
    description: 'Show reactions below chat messages.',
    category: 'Chat',
    enabledByDefault: true
  },
  {
    id: 'thread-preview',
    name: 'Thread Preview',
    description: 'Display a thread snippet panel for the selected channel.',
    category: 'Chat',
    enabledByDefault: false
  },
  {
    id: 'server-badges',
    name: 'Server Badges',
    description: 'Show custom badges on server icons and hover cards.',
    category: 'Server',
    enabledByDefault: true
  },
  {
    id: 'animated-status',
    name: 'Animated Status',
    description: 'Animate server status dots for a richer Discord feel.',
    category: 'Server',
    enabledByDefault: false
  },
  {
    id: 'voice-calls',
    name: 'Voice Calls',
    description: 'Show a voice call activity banner for the active channel.',
    category: 'Voice',
    enabledByDefault: false
  },
  {
    id: 'bot-support',
    name: 'Bot Support',
    description: 'Enable bot panel rendering and future bot integrations.',
    category: 'Bots',
    enabledByDefault: false
  }
];

export const emojiMap = {
  tada: '🎉',
  fire: '🔥',
  heart: '❤️',
  party: '🥳',
  eyes: '👀',
  star: '✨',
  rocket: '🚀'
};
