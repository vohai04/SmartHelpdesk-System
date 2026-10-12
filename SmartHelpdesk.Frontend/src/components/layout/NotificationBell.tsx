import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, CheckCircle } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { signalRService } from "../../services/signalrService";
import { useToast } from "../../hooks/use-toast";
import { axiosClient } from "../../api/axiosClient";
import { useAuthStore } from "../../store/authStore";
import { ToastAction } from "../ui/toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  ticketId?: string;
  messageId?: string;
  date: string;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const userId = useAuthStore(state => state.user?.id);
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const requestNumber = useRef(0);
  const seen = useRef(new Set<string>());
  const reload = useCallback(async () => {
    const request = ++requestNumber.current;
    try {
      const data = await axiosClient.get<unknown, {items: Notification[]; unreadCount: number}>("/notifications");
      if (request !== requestNumber.current || useAuthStore.getState().user?.id !== userId) return;
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
      data.items.forEach(item => seen.current.add(item.id));
      setLoadError(false);
    } catch {
      if (request === requestNumber.current) setLoadError(true);
    } finally {
      if (request === requestNumber.current) setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const pendingRequests = requestNumber;
    const initialLoad = window.setTimeout(() => { void reload(); }, 0);
    const reconnect = signalRService.subscribeReconnect(() => { void reload(); });
    const unsubscribe = signalRService.subscribe((title, message, ticketId, messageId, notificationId) => {
      if (!notificationId || !seen.current.has(notificationId)) {
        if (notificationId) seen.current.add(notificationId);
        toast({ title, description: message, action: ticketId ? (
          <ToastAction altText="View ticket" onClick={() => navigate(`/tickets/${ticketId}${messageId ? `#msg-${messageId}` : ''}`)}>View ticket</ToastAction>
        ) : undefined });
      }
      void reload();
    });
    const refresh = () => { void reload(); };
    window.addEventListener('focus', refresh);
    return () => { window.clearTimeout(initialLoad); pendingRequests.current++; unsubscribe(); reconnect(); window.removeEventListener('focus', refresh); };
  }, [reload, navigate, toast]);

  const updateNotifications = async (ids: string[], dismiss = false) => {
    if (!ids.length) return;
    try {
      await axiosClient.post(`/notifications/${dismiss ? 'dismiss' : 'read'}`, { ids });
      await reload();
    } catch {
      toast({ title: "Could not update notifications", description: "Please try again.", variant: "destructive" });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) void reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        aria-label="Notifications"
        className="icon-button notification-button"
        style={{ color: "var(--text-tertiary)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-hover)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <Bell size={17} weight="regular" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] font-bold text-[var(--text-on-accent)] px-1 ring-2 ring-[var(--surface-default)]"
            style={{ background: "var(--danger)", color: "var(--text-on-danger)" }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="notifications-panel"
          style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)] bg-[var(--surface-bg)]">
            <h3 className="font-semibold text-[13px] text-[var(--text-primary)]">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="text-[11px] text-[var(--accent)] font-medium hover:text-[var(--accent)] "
                onClick={() => void updateNotifications(notifications.map(n => n.id), true)}
              >
                Clear shown
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {loading ? <p className="p-4 text-sm">Loading notifications...</p> : loadError ? <div className="p-4 text-sm"><p>Could not load notifications.</p><button className="secondary-button mt-3" onClick={() => void reload()}>Try again</button></div> : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                <CheckCircle size={32} weight="light" className="text-[var(--text-tertiary)] mb-2" />
                <p className="text-[13px] text-[var(--text-secondary)] font-medium">You're all caught up!</p>
                <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">No new notifications</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.ticketId ? `/tickets/${notif.ticketId}${notif.messageId ? `#msg-${notif.messageId}` : ''}` : "/tickets"}
                    className="flex flex-col px-4 py-3 border-b border-[var(--border-default)] hover:bg-[var(--surface-bg)] transition-colors relative"
                    onClick={() => { setIsOpen(false); void updateNotifications([notif.id]); }}
                  >
                    {!notif.read && (
                      <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                    <span className="text-[13px] font-semibold text-[var(--text-primary)] ml-2">{notif.title}</span>
                    <span className="text-[12px] text-[var(--text-secondary)] mt-0.5 ml-2 leading-snug">{notif.message}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] mt-1.5 ml-2">
                      {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 bg-[var(--surface-bg)] border-t border-[var(--border-default)] text-center">
            <Link to="/tickets" onClick={() => setIsOpen(false)} className="text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              View tickets
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
