import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';
import { useAuthStore } from '../store/authStore';

export interface TicketRealtimeUpdate {
  ticketId: string;
  status: string;
  priority: string | null;
  triageStatus: 'NotRequested' | 'Pending' | 'Processing' | 'Completed' | 'Failed';
  prioritySource: 'Legacy' | 'Ai' | 'Manual' | 'Pending';
  version: number;
  assignedToId: string | null;
  assignedToName: string | null;
  transferPending: boolean;
}
type NotificationListener = (title: string, message: string, ticketId?: string, messageId?: string, notificationId?: string) => void;

class SignalRService {
  private connection: HubConnection | null = null;
  private retry: ReturnType<typeof setTimeout> | undefined;
  private listeners = new Set<NotificationListener>();
  private updates = new Set<(update: TicketRealtimeUpdate) => void>();
  private reconnects = new Set<() => void>();

  public startConnection() {
    const auth=useAuthStore.getState();
    if (!auth.isAuthenticated) return;
    try {
      const payload=JSON.parse(atob((auth.token || '').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      if(typeof payload.exp!=='number' || payload.exp*1000<=Date.now()) {auth.logout();return;}
    } catch {auth.logout();return;}
    if (this.connection && this.connection.state !== HubConnectionState.Disconnected) return;
    clearTimeout(this.retry);
    const connection = new HubConnectionBuilder()
      .withUrl(import.meta.env.VITE_HUB_URL || 'https://localhost:7055/hubs/notifications', {
        accessTokenFactory: () => useAuthStore.getState().token || '',
      }).withAutomaticReconnect().configureLogging(LogLevel.Warning).build();
    this.connection = connection;
    connection.on('ReceiveNotification', (payload: {title:string;message:string;ticketId?:string;messageId?:string;id?:string}) => {
      if(this.connection === connection) this.listeners.forEach(listener => listener(payload.title,payload.message,payload.ticketId,payload.messageId,payload.id));
    });
    connection.on('TicketTriageUpdated', (payload:TicketRealtimeUpdate) => {
      if(this.connection === connection) this.updates.forEach(listener => listener(payload));
    });
    connection.onreconnected(() => this.reconnects.forEach(listener => listener()));
    const retry = () => {
      if(this.connection === connection && useAuthStore.getState().isAuthenticated)
        this.retry = setTimeout(() => this.startConnection(),3000);
    };
    connection.onclose(retry);
    void connection.start().then(() => {
      if(this.connection === connection) this.reconnects.forEach(listener => listener());
      else void connection.stop();
    }).catch(retry);
  }
  public subscribe(listener: NotificationListener) {
    this.listeners.add(listener);return () => {this.listeners.delete(listener);};
  }
  public subscribeTicketUpdates(listener:(update:TicketRealtimeUpdate)=>void) {
    this.updates.add(listener);return () => {this.updates.delete(listener);};
  }
  public subscribeReconnect(listener:()=>void) {
    this.reconnects.add(listener);return () => {this.reconnects.delete(listener);};
  }
  public stopConnection() {
    clearTimeout(this.retry);const previous=this.connection;this.connection=null;
    if(previous) void previous.stop();
  }
}
export const signalRService = new SignalRService();
