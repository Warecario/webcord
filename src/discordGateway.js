const GATEWAY_URL = 'wss://gateway.discord.gg/?v=10&encoding=json';
const HEARTBEAT_INTERVAL = 45000; // milliseconds

export class DiscordGateway {
  constructor(token, eventHandler) {
    this.token = token.access_token;
    this.eventHandler = eventHandler;
    this.ws = null;
    this.heartbeatInterval = null;
    this.sequence = null;
    this.sessionId = null;
    this.resumeUrl = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.ws = new WebSocket(GATEWAY_URL);
    this.ws.addEventListener('open', this.onOpen.bind(this));
    this.ws.addEventListener('message', this.onMessage.bind(this));
    this.ws.addEventListener('close', this.onClose.bind(this));
    this.ws.addEventListener('error', this.onError.bind(this));
  }

  onOpen() {
    console.log('Discord Gateway connected');
    this.connected = true;
    this.sendIdentify();
  }

  onMessage(event) {
    const data = JSON.parse(event.data);
    console.log('Gateway received:', data);

    if (data.s) {
      this.sequence = data.s;
    }

    switch (data.op) {
      case 0: // Dispatch
        this.eventHandler(data.t, data.d);
        break;
      case 1: // Heartbeat
        this.sendHeartbeat();
        break;
      case 7: // Reconnect
        console.log('Gateway reconnecting...');
        this.reconnect();
        break;
      case 9: // Invalid Session
        console.error('Invalid Gateway session. Reconnecting...');
        this.sessionId = null;
        this.sequence = null;
        this.reconnect(false); // Do not resume
        break;
      case 10: // Hello
        this.startHeartbeat(data.d.heartbeat_interval);
        if (this.sessionId) {
          this.sendResume();
        } else {
          this.sendIdentify();
        }
        break;
      case 11: // Heartbeat ACK
        // All good
        break;
      default:
        console.warn('Unknown Gateway opcode:', data.op, data);
    }

    // Store session info on READY event
    if (data.op === 0 && data.t === 'READY') {
      this.sessionId = data.d.session_id;
      this.resumeUrl = data.d.resume_gateway_url;
      console.log('Gateway READY. Session ID:', this.sessionId);
    }
  }

  onClose(event) {
    console.log('Discord Gateway closed:', event.code, event.reason);
    this.connected = false;
    this.stopHeartbeat();
    this.reconnectAttempts++;

    if (event.code === 4004) { // Authentication failed
      console.error('Discord Gateway authentication failed. Please re-login.');
      // TODO: Handle re-login flow (e.g., clear token, redirect to login page)
      return;
    }

    if (this.reconnectAttempts <= this.maxReconnectAttempts) {
      setTimeout(() => this.reconnect(), Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000));
    } else {
      console.error('Max reconnect attempts reached. Gateway connection failed.');
      // TODO: Notify user, disable features
    }
  }

  onError(event) {
    console.error('Discord Gateway error:', event);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket not open. Cannot send data:', data);
    }
  }

  sendIdentify() {
    this.send({
      op: 2,
      d: {
        token: this.token,
        intents: 513,
        properties: {
          $os: 'browser',
          $browser: 'webcord',
          $device: 'webcord'
        }
      }
    });
  }

  sendResume() {
    console.log('Attempting to resume Gateway session:', this.sessionId, this.sequence);
    this.send({
      op: 6,
      d: {
        token: this.token,
        session_id: this.sessionId,
        seq: this.sequence
      }
    });
  }

  sendHeartbeat() {
    this.send({
      op: 1,
      d: this.sequence
    });
  }

  startHeartbeat(interval) {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, interval || HEARTBEAT_INTERVAL);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  reconnect(resume = true) {
    this.disconnect();
    if (resume && this.sessionId && this.sequence && this.resumeUrl) {
      // For now, just a fresh connect. Full resume logic would require specific URL management.
      this.connect(); 
    } else {
      this.sessionId = null;
      this.sequence = null;
      this.resumeUrl = null;
      this.connect();
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
  }
}
