import { useState, useEffect, useRef } from "react";
import { Bell, CheckCircle } from "@phosphor-icons/react";
import { Link, useNavigate } from "react-router-dom";
import { signalRService } from "../../services/signalrService";
import { useToast } from "../../hooks/use-toast";
import { ToastAction } from "../ui/toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  ticketId?: string;
  messageId?: string;
  date: Date;
  read: boolean;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Lắng nghe SignalR
    const unsubscribe = signalRService.subscribe((title, message, ticketId, messageId) => {
      const newNotif: Notification = {
        id: Math.random().toString(36).substring(7),
        title,
        message,
        ticketId,
        messageId,
        date: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotif, ...prev].slice(0, 10)); // Giữ 10 thông báo mới nhất
      setUnreadCount(prev => prev + 1);

      // Hiển thị Toast Popup
      toast({
        title: title,
        description: message,
        action: ticketId ? (
          <ToastAction altText="Xem Ticket" onClick={() => navigate(`/tickets/${ticketId}${messageId ? `#msg-${messageId}` : ''}`)}>
            Xem ngay
          </ToastAction>
        ) : undefined,
      });
    });

    return () => unsubscribe();
  }, []);

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
    if (!isOpen && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpenDropdown}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150"
        style={{ color: "#78716c" }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f5f5f4"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
      >
        <Bell size={17} weight="regular" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1 ring-2 ring-white"
            style={{ background: "#dc2626" }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-50 overflow-hidden"
          style={{ boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)" }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-[13px] text-slate-800">Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="text-[11px] text-blue-600 font-medium hover:text-blue-700"
                onClick={() => setNotifications([])}
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center flex flex-col items-center justify-center">
                <CheckCircle size={32} weight="light" className="text-slate-300 mb-2" />
                <p className="text-[13px] text-slate-500 font-medium">You're all caught up!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">No new notifications</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <Link
                    key={notif.id}
                    to={notif.ticketId ? `/tickets/${notif.ticketId}${notif.messageId ? `#msg-${notif.messageId}` : ''}` : "/tickets"}
                    className="flex flex-col px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors relative"
                    onClick={() => setIsOpen(false)}
                  >
                    {!notif.read && (
                      <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    <span className="text-[13px] font-semibold text-slate-800 ml-2">{notif.title}</span>
                    <span className="text-[12px] text-slate-500 mt-0.5 ml-2 leading-snug">{notif.message}</span>
                    <span className="text-[10px] text-slate-400 mt-1.5 ml-2">
                      {notif.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center">
            <Link to="/tickets" onClick={() => setIsOpen(false)} className="text-[12px] font-medium text-slate-600 hover:text-slate-900 transition-colors">
              View all activity
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
