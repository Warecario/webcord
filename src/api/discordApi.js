const API_BASE = 'https://discord.com/api/v10';

function authHeaders(token) {
  return {
    Authorization: `${token.token_type} ${token.access_token}`,
    Accept: 'application/json'
  };
}

async function safeFetch(url, token, options = {}) {
  if (!token?.access_token) {
    throw new Error('Discord access token is missing');
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...authHeaders(token)
    }
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Discord API error (${response.status}): ${payload}`);
  }

  return response.json();
}

export async function fetchCurrentUser(token) {
  return safeFetch(`${API_BASE}/users/@me`, token);
}

export async function fetchGuilds(token) {
  const guilds = await safeFetch(`${API_BASE}/users/@me/guilds`, token);
  return guilds.filter((guild) => typeof guild.id === 'string');
}

export async function fetchChannels(guildId, token) {
  return safeFetch(`${API_BASE}/guilds/${guildId}/channels`, token);
}

export async function fetchMessages(channelId, token) {
  return safeFetch(`${API_BASE}/channels/${channelId}/messages?limit=25`, token);
}
