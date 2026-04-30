import { emojiMap } from './plugins.js';

export const pluginModules = [
  {
    id: 'custom-emojis',
    formatMessageContent: (content) =>
      content.replace(/:([a-z0-9_+-]+):/gi, (match, token) => emojiMap[token] || match)
  },
  {
    id: 'reactions-preview',
    renderMessageReactions: ({ message }) => {
      if (!message.reactions?.length) {
        return null;
      }
      return (
        <div className="reactions-row">
          {message.reactions.map((reaction) => (
            <span key={reaction.emoji} className="reaction-pill">
              {reaction.emoji} {reaction.count}
            </span>
          ))}
        </div>
      );
    }
  },
  {
    id: 'thread-preview',
    renderThreadPreview: ({ channel }) => {
      const threadCount = channel.messages.reduce((sum, message) => sum + (message.threadCount || 0), 0);
      if (threadCount === 0) {
        return null;
      }
      return (
        <div className="thread-panel">
          <div className="thread-title">Thread preview</div>
          <div className="thread-body">
            <strong>{threadCount}</strong> active thread{threadCount === 1 ? '' : 's'} in this channel.
          </div>
        </div>
      );
    }
  },
  {
    id: 'animated-status',
    renderServerStatus: ({ server }) => (
      <span className="status-dot" title={`Online status for ${server.name}`} />
    )
  },
  {
    id: 'voice-calls',
    renderCallStatus: ({ channel }) => (
      <div className="voice-banner">
        <div className="voice-icon">🎧</div>
        <div>
          <div className="voice-title">Voice channel active</div>
          <div className="voice-meta">Connected to {channel.name} voice session</div>
        </div>
      </div>
    )
  },
  {
    id: 'bot-support',
    renderBotPanel: () => (
      <div className="bot-panel">
        <div className="bot-title">Bot helper active</div>
        <div className="bot-body">Bot commands and automated moderation can be added here.</div>
      </div>
    )
  }
];
