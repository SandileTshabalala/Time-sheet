// client/src/services/signalr.service.ts
import * as signalR from '@microsoft/signalr';

class SignalRService {
  private connection: signalR.HubConnection | null = null;
  private starting: Promise<void> | null = null;

  private getHubUrl() {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = apiUrl.replace(/\/+api\/?$/, '');
    return `${baseUrl}/hubs/notifications`;
  }

  private buildConnection() {
    const token = () => localStorage.getItem('token') || '';

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.getHubUrl(), {
        accessTokenFactory: token,
        withCredentials: true,
      })
      .withAutomaticReconnect({ nextRetryDelayInMilliseconds: () => 3000 })
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.onclose(() => {
      this.starting = null;
    });
    this.connection.onreconnected(() => {
      // no-op
    });
  }

  async start() {
    // Do not attempt to connect without a token
    const tokenVal = localStorage.getItem('token');
    if (!tokenVal) {
      return;
    }

    if (!this.connection) this.buildConnection();
    if (!this.connection) return; // safety
    if (this.connection.state === signalR.HubConnectionState.Connected) return;

    if (!this.starting) {
      this.starting = this.connection
        .start()
        .catch((err) => {
          // Swallow errors; will retry on next call
          console.debug('SignalR start failed', err);
        }) as Promise<void>;
    }
    await this.starting;
  }

  async stop() {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }

  isConnected() {
    return this.connection?.state === signalR.HubConnectionState.Connected;
  }

  on<T = any>(eventName: string, callback: (payload: T) => void) {
    if (!this.connection) this.buildConnection();
    this.connection?.on(eventName, callback as any);
  }

  off(eventName: string, callback?: (...args: any[]) => void) {
    this.connection?.off(eventName, callback as any);
  }
}

const signalrService = new SignalRService();
export default signalrService;
