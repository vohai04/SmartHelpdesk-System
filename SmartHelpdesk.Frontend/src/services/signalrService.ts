import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';

class SignalRService {
  private connection: HubConnection | null = null;
  private listeners: ((title: string, message: string, ticketId?: string, messageId?: string) => void)[] = [];

  public startConnection() {
    if (this.connection) return;

    const hubUrl = import.meta.env.VITE_HUB_URL || "https://localhost:7055/hubs/notifications";

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => useAuthStore.getState().token || ""
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.connection.start()
      .then(() => console.log('SignalR Connected.'))
      .catch(err => console.error('SignalR Connection Error: ', err));

    this.connection.on('ReceiveNotification', (payload: { title: string, message: string, ticketId?: string, messageId?: string, date: string }) => {
      this.listeners.forEach(listener => listener(payload.title, payload.message, payload.ticketId, payload.messageId));
    });
  }

  public subscribe(listener: (title: string, message: string, ticketId?: string, messageId?: string) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public stopConnection() {
    if (this.connection) {
      this.connection.stop();
      this.connection = null;
    }
  }
}

export const signalRService = new SignalRService();
