export const servers = [
  {
    id: '105123456789012345',
    name: 'Aurora Labs',
    icon: 'A',
    voiceChannels: [
      { id: '110987654321098770', name: 'General', users: 5 },
      { id: '110987654321098771', name: 'Music', users: 3 }
    ],
    bots: [
      {
        id: '900123456789012345',
        name: 'AuroraBot',
        description: 'Automated moderation, welcome messages, and slash commands.'
      }
    ],
    members: [
      { id: '202312312312312312', name: 'Ari', role: 'Admin' },
      { id: '202312312312312313', name: 'Nina', role: 'Designer' }
    ],
    channels: [
      {
        id: '110987654321098765',
        name: 'general',
        messages: [
          {
            id: 'm1',
            author: 'Ari',
            content: 'Welcome to Aurora Labs! :tada:',
            timestamp: 'Today at 9:02 AM',
            reactions: [
              { emoji: '🔥', count: 12 },
              { emoji: '👍', count: 7 }
            ],
            threadCount: 3
          },
          {
            id: 'm2',
            author: 'Nina',
            content: 'I just finished the design updates.',
            timestamp: 'Today at 9:08 AM',
            reactions: [{ emoji: '🎨', count: 4 }],
            threadCount: 1
          },
          {
            id: 'm3',
            author: 'Ray',
            content: 'Anyone up for a quick standup?',
            timestamp: 'Today at 9:12 AM',
            reactions: [{ emoji: '👀', count: 3 }],
            threadCount: 0
          }
        ]
      },
      {
        id: '110987654321098766',
        name: 'dev-chat',
        messages: [
          {
            id: 'm4',
            author: 'Zoe',
            content: 'Pushed a fix for the login flow. :rocket:',
            timestamp: 'Today at 9:14 AM',
            reactions: [{ emoji: '✅', count: 9 }],
            threadCount: 2
          },
          {
            id: 'm5',
            author: 'Dex',
            content: 'Running the staging build now.',
            timestamp: 'Today at 9:17 AM',
            reactions: [{ emoji: '💾', count: 2 }],
            threadCount: 1
          }
        ]
      },
      {
        id: '110987654321098767',
        name: 'memes',
        messages: [
          {
            id: 'm6',
            author: 'Jax',
            content: 'Did you see the new Webcord icon? :eyes:',
            timestamp: 'Today at 9:20 AM',
            reactions: [{ emoji: '😂', count: 17 }],
            threadCount: 0
          }
        ]
      }
    ]
  },
  {
    id: '105123456789012346',
    name: 'Project Vanta',
    icon: 'V',
    voiceChannels: [
      { id: '110987654321098772', name: 'Standup', users: 2 },
      { id: '110987654321098773', name: 'Strategy', users: 4 }
    ],
    bots: [
      {
        id: '900123456789012346',
        name: 'VantaBot',
        description: 'Issue automation, reminders, and server analytics.'
      }
    ],
    members: [
      { id: '202312312312312314', name: 'Lena', role: 'Manager' },
      { id: '202312312312312315', name: 'Erin', role: 'Support' }
    ],
    channels: [
      {
        id: '110987654321098768',
        name: 'announcements',
        messages: [
          {
            id: 'm7',
            author: 'Lena',
            content: 'Deployment scheduled for tonight.',
            timestamp: 'Today at 10:05 AM',
            reactions: [{ emoji: '📢', count: 8 }],
            threadCount: 0
          }
        ]
      },
      {
        id: '110987654321098769',
        name: 'support',
        messages: [
          {
            id: 'm8',
            author: 'Erin',
            content: 'The new bug report page looks solid.',
            timestamp: 'Today at 10:12 AM',
            reactions: [{ emoji: '🛠️', count: 5 }],
            threadCount: 1
          }
        ]
      }
    ]
  }
];

export const defaultServerId = servers[0].id;
export const defaultChannelId = servers[0].channels[0].id;

export function findServer(id) {
  return servers.find((server) => server.id === id);
}

export function findChannel(serverId, channelId) {
  const server = findServer(serverId);
  return server?.channels.find((channel) => channel.id === channelId) ?? null;
}
