import { DISCORD_CLIENT_ID, DISCORD_SCOPES, getDiscordRedirectUri } from './discordConfig.js';

const CODE_VERIFIER_KEY = 'webcord_discord_code_verifier';
const TOKEN_STORAGE_KEY = 'webcord_discord_token';
const STATE_KEY = 'webcord_discord_state';

function encodeHash(buffer) {
  const bytes = new Uint8Array(buffer);
  let str = '';
  for (const byte of bytes) {
    str += String.fromCharCode(byte);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(length = 64) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array)
    .map((byte) => ('0' + byte.toString(16)).slice(-2))
    .join('');
}

async function sha256(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  return window.crypto.subtle.digest('SHA-256', data);
}

export async function createDiscordOAuthUrl() {
  if (!DISCORD_CLIENT_ID) {
    throw new Error('Missing VITE_DISCORD_CLIENT_ID');
  }

  const codeVerifier = randomString(64);
  const codeChallengeBuffer = await sha256(codeVerifier);
  const codeChallenge = encodeHash(codeChallengeBuffer);
  const state = randomString(16);
  const redirectUri = getDiscordRedirectUri();

  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: DISCORD_SCOPES,
    prompt: 'consent',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

export function getDiscordCallbackData(url = window.location.href) {
  const parsed = new URL(url);
  const search = parsed.search || '';
  const hash = parsed.hash || '';
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?')) : '';
  const query = new URLSearchParams(`${search}${hashQuery}`);
  const code = query.get('code');
  const state = query.get('state');
  const error = query.get('error');

  return { code, state, error };
}

export function getStoredCodeVerifier() {
  return localStorage.getItem(CODE_VERIFIER_KEY) || '';
}

export function getStoredState() {
  return localStorage.getItem(STATE_KEY) || '';
}

export function clearDiscordFlowState() {
  localStorage.removeItem(CODE_VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}

export function saveDiscordToken(tokenPayload) {
  localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokenPayload));
}

export function loadDiscordToken() {
  const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearDiscordToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function exchangeDiscordCode(code, codeVerifier) {
  const redirectUri = getDiscordRedirectUri();
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshDiscordToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken
  });

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Discord token refresh failed: ${error}`);
  }

  return response.json();
}
