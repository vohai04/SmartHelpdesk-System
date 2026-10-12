import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CaretDown,
  PaperPlaneRight,
  Sparkle,
  LockKey,
  Paperclip,
  CheckCircle,
  Tag,
  X,
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, priorityLabel, applyTicketUpdate, type TicketDto, type TicketMessageDto, type AgentDto } from "../../services/ticketService";
import { signalRService } from "../../services/signalrService";
import { useToast } from "../../hooks/use-toast";
import { SecureAttachment } from "../../components/tickets/SecureAttachment";
import { TicketWorkflowPanel } from "../../components/tickets/TicketWorkflowPanel";

// Ticket badge palettes.
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Open:       { bg: "var(--accent-subtle)",   color: "var(--accent)",   border: "var(--accent-border)" },
  InProgress: { bg: "var(--warning-subtle)",                color: "var(--warning)",         border: "var(--warning-border)" },
  Resolved:   { bg: "var(--success-subtle)",  color: "var(--success)",  border: "var(--success-border)" },
  Closed:     { bg: "var(--surface-bg)",      color: "var(--text-tertiary)", border: "var(--border-strong)" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Low:        { bg: "var(--surface-bg)",      color: "var(--text-secondary)", border: "var(--border-default)" },
  Medium:     { bg: "var(--accent-subtle)",   color: "var(--accent)",         border: "var(--accent-border)" },
  High:       { bg: "var(--danger-subtle)",                color: "var(--danger)",               border: "var(--danger-border)" },
  Urgent:     { bg: "var(--danger-subtle)",                color: "var(--danger)",               border: "var(--danger-border)" },
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();

  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [messages, setMessages] = useState<TicketMessageDto[]>([]);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const requestId=useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdminOrAgent = user?.role === "Admin" || user?.role === "Agent";

  const loadTicketData = useCallback(async () => {
    if (!id) return;
    const sequence=++requestId.current;
    setLoading(true);
    try {
      const [ticketData,messageData,agentList]=await Promise.all([
        ticketService.getTicketById(id),ticketService.getMessages(id,1,100),
        isAdminOrAgent?ticketService.getAgents():Promise.resolve([]),
      ]);
      if(sequence!==requestId.current) return;
      setTicket(current=>current && current.id===ticketData.id && current.version>ticketData.version?current:ticketData);
      setMessages(messageData.items);setAgents(agentList);
    } catch {
      if(sequence===requestId.current) toast({title:"Error",description:"Failed to load ticket details",variant:"destructive"});
    } finally {
      if(sequence===requestId.current) setLoading(false);
    }
  }, [id,isAdminOrAgent,toast]);

  const cancelPendingLoad=useCallback(()=>{requestId.current++;},[]);
  useEffect(() => {
    const timer = setTimeout(() => { void loadTicketData(); }, 0);
    return () => {clearTimeout(timer);cancelPendingLoad();};
  }, [loadTicketData, cancelPendingLoad]);

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Optional: highlight effect
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'var(--accent-subtle)';
        element.style.transition = 'background-color 1s ease';
        setTimeout(() => {
          element.style.backgroundColor = originalBg;
        }, 2000);
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    // Subscribe to SignalR to reload messages real-time
    const unsubscribe = signalRService.subscribe((_title, _message, ticketId, messageId) => {
      // Check if this notification is relevant to the current ticket,
      // or just safely reload the messages stream
      if (id && ticketId === id) {
        ticketService.getTicketById(id).then(data => {
          setTicket(current=>current && current.id===data.id && current.version>data.version ? current : data);
        }).catch(console.error);

        if (messageId) ticketService.getMessages(id, 1, 100).then(data => {
          setMessages(data.items);
        }).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    let lastVersion=-1;
    const updates=signalRService.subscribeTicketUpdates(update=>{
      if(update.ticketId!==id || update.version<=lastVersion) return;
      lastVersion=update.version;
      setTicket(current=>current?applyTicketUpdate(current,update):current);
      // AI summary is staff-only, so fetch it through the authorized endpoint.
      // Triage never reloads the conversation stream.
      void ticketService.getTicketById(update.ticketId).then(data=>setTicket(current=>current && current.id===data.id && current.version>data.version?current:data)).catch(()=>{});
    });
    const reconnect=signalRService.subscribeReconnect(()=>{ void loadTicketData(); });
    return ()=>{updates();reconnect();};
  }, [id, loadTicketData]);

  const [isUpdating, setIsUpdating] = useState(false);
  const handleWorkflowUpdate = (updated:TicketDto) => {
    setTicket(current=>current && current.version>updated.version?current:updated);
    void ticketService.getMessages(updated.id).then(data=>setMessages(data.items)).catch(()=>{});
  };
  const handleUpdateTicket = async (field: string, value: string | null) => {
    if (!id || !ticket || isUpdating) return;
    setIsUpdating(true);
    try {
      const updated = await ticketService.updateTicket(id, { [field]: value, expectedVersion: ticket.version });
      setTicket(current=>current && current.version>updated.version?current:updated);
    } catch {
      toast({ title: "Could not update", description: "Refresh the ticket and try again.", variant: "destructive" });
      void ticketService.getTicketById(id).then(data=>setTicket(current=>current && current.version>data.version?current:data)).catch(()=>{});
    } finally { setIsUpdating(false); }
  };

  const handleSendReply = async () => {
    if (!id || !replyContent.trim()) return;
    try {
      setIsSending(true);

      const attachmentIds: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          const res = await ticketService.uploadAttachment(file, id);
          attachmentIds.push(res.id);
        }
      }

      const newMsg = await ticketService.sendMessage(id, replyContent, isInternal, attachmentIds);
      setMessages(prev => [...prev, newMsg]);
      setReplyContent("");
      setSelectedFiles([]);
      setIsInternal(false);
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
    // reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAiSuggest = async () => {
    if (!id) return;
    try {
      setIsSuggesting(true);
      const res = await ticketService.suggestReply(id);
      setReplyContent(res.suggestion);
      toast({ title: "AI Suggestion Generated", description: "Review and edit before sending." });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to generate AI suggestion", variant: "destructive" });
    } finally {
      setIsSuggesting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-[var(--text-secondary)]">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-[var(--danger)] ">Ticket not found</div>;
  }

  return (
    <div
      className="ticket-detail flex flex-col rounded-xl shadow-sm overflow-hidden"
      style={{
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)"
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-2 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 shrink-0" style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-default)" }}>
        <button
          onClick={() => navigate('/tickets')}
          aria-label="Back to tickets"
          className="p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-bg)] transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h1 className="w-full sm:w-auto sm:flex-1 min-w-0 text-base sm:text-xl font-bold truncate" title={ticket.title} style={{ color: "var(--text-primary)" }}>{ticket.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: STATUS_STYLE[ticket.status]?.bg, color: STATUS_STYLE[ticket.status]?.color, border: `1px solid ${STATUS_STYLE[ticket.status]?.border}` }}>
              {ticket.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: (PRIORITY_STYLE[ticket.priority ?? ""] ?? PRIORITY_STYLE.Low).bg, color: (PRIORITY_STYLE[ticket.priority ?? ""] ?? PRIORITY_STYLE.Low).color, border: `1px solid ${(PRIORITY_STYLE[ticket.priority ?? ""] ?? PRIORITY_STYLE.Low).border}` }}>
              {priorityLabel(ticket)}
            </span>
          </div>
          <p className="text-xs sm:text-sm flex flex-wrap items-center gap-x-2 gap-y-1" style={{ color: "var(--text-secondary)" }}>
            <span>Ticket #{ticket.id.split('-')[0].toUpperCase()}</span>
            <span>•</span>
            <span>Created by {ticket.createdByName} on {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
        {/* Left Panel: Info */}
        <div className="w-full lg:w-80 shrink-0 lg:border-r flex flex-col" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-bg)" }}>
          {/* Mobile Toggle */}
          <button
            className="lg:hidden flex items-center justify-between p-4 border-b transition-colors"
            aria-expanded={mobileInfoOpen}
            style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
            onClick={() => setMobileInfoOpen(!mobileInfoOpen)}
          >
            <span className="text-[13px] font-semibold">Ticket Details</span>
            <CaretDown size={14} weight="bold" style={{ color: "var(--text-tertiary)", transform: mobileInfoOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>

          <div className={`${mobileInfoOpen ? 'block' : 'hidden'} lg:block flex-1 p-5 space-y-6 overflow-y-auto max-h-[30dvh] lg:max-h-none`}>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Description</h3>
              <div className="p-4 rounded-xl text-sm whitespace-pre-wrap" style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)", color: "var(--text-secondary)" }}>
                {ticket.description}
              </div>
            </div>

            {/* AI Insights (Hidden from Customers) */}
            {isAdminOrAgent && ticket.isAiTriaged && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex items-center gap-1.5">
                  <Sparkle size={14} className="text-[var(--accent)] " />
                  AI Triage
                </h3>
                <div className="bg-[var(--accent-subtle)]/50 p-3 rounded-xl border border-[var(--accent-border)] space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Sentiment:</span>
                    <span className="font-medium text-[var(--accent)] capitalize">{ticket.aiSentiment || 'Neutral'}</span>
                  </div>
                  {ticket.aiSummary && (
                    <div className="pt-2 border-t border-[var(--accent-border)] text-[13px] text-[var(--text-secondary)] leading-relaxed">
                      <span className="font-semibold block mb-1">Summary:</span>
                      {ticket.aiSummary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Details</h3>
              <div className="rounded-xl" style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)" }}>
                <div className="p-3 flex items-center justify-between text-sm" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                  <span className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}><Tag size={16} /> Category</span>
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>{ticket.categoryName}</span>
                </div>
              </div>
            </div>
            <TicketWorkflowPanel ticket={ticket} agents={agents} onUpdate={handleWorkflowUpdate} onArchived={()=>navigate("/tickets")}/>

            {/* Admin Controls */}
            {isAdminOrAgent && (user?.role === "Admin" || ticket.assignedToId === user?.id) && ticket.status !== "Closed" && ticket.status !== "Resolved" && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-tertiary)" }}>Management</h3>
                <div className="p-3 rounded-xl space-y-3" style={{ background: "var(--surface-default)", border: "1px solid var(--border-default)" }}>
                  <div>
                    <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-secondary)" }}>Priority</label>
                    <select
                      className="w-full text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-strong)", color: "var(--text-primary)" }}
                      value={ticket.priority ?? ""}
                      disabled={isUpdating}
                      onChange={(e) => handleUpdateTicket("priority", e.target.value)}
                    >
                      {!ticket.priority && <option value="" disabled>{priorityLabel(ticket)}</option>}
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Panel: Messages */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ background: "var(--surface-default)" }}>
          {/* Thread */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[var(--text-tertiary)]">
                <CheckCircle size={48} weight="light" className="mb-4 text-[var(--text-tertiary)]" />
                <p>No messages yet.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user?.id;

                return (
                  <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-4 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} p-2 rounded-xl transition-colors`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1" style={{ background: isMe ? 'var(--accent)' : 'var(--text-secondary)', color: isMe ? 'var(--text-on-accent)' : 'var(--surface-default)' }}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>

                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{msg.senderName}</span>
                        <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>

                      <div className={`
                        relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed
                        ${msg.isInternalNote
                          ? 'bg-[var(--warning-subtle)] border border-[var(--warning-border)] text-[var(--warning)] rounded-tl-sm'
                          : isMe
                            ? 'bg-[var(--accent)] text-[var(--text-on-accent)] rounded-tr-sm shadow-sm'
                            : 'rounded-tl-sm'
                        }
                      `} style={!msg.isInternalNote && !isMe ? { background: "var(--surface-bg)", color: "var(--text-primary)", border: "1px solid var(--border-strong)" } : undefined}>
                        {msg.isInternalNote && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--warning)] mb-1">
                            <LockKey size={12} weight="bold" /> Internal Note
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.attachments.map(att => <SecureAttachment key={att.id} attachment={att}/>)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          {ticket.status !== 'Closed' ? (
            <div className="p-4" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-bg)" }}>
              <div className={`
                border rounded-xl overflow-hidden transition-colors
                ${isInternal ? 'border-[var(--warning-border)] focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100' : 'focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'}
              `} style={{ background: "var(--surface-default)", borderColor: !isInternal ? "var(--border-strong)" : undefined }}>
                {isInternal && (
                  <div className="bg-[var(--warning-subtle)] px-3 py-1.5 border-b border-[var(--warning-border)] flex items-center gap-1.5 text-xs font-semibold text-[var(--warning)] ">
                    <LockKey size={14} />
                    Private Internal Note (Only visible to Agents)
                  </div>
                )}
                <textarea
                  className="w-full p-4 text-sm outline-none resize-none min-h-[100px] bg-transparent"
                  style={{ color: "var(--text-primary)" }}
                  placeholder={isInternal ? "Write an internal note..." : "Type your reply..."}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />

                {selectedFiles.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--surface-bg)] border border-[var(--border-default)] rounded-lg text-xs font-medium text-[var(--text-secondary)]">
                        <Paperclip size={12} className="text-[var(--text-secondary)]" />
                        <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                        <button onClick={() => removeFile(i)} className="ml-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2" style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--surface-bg)" }}>
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".jpg,.jpeg,.png,.pdf,.docx"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      aria-label="Attach files"
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: "var(--text-tertiary)" }}
                      onMouseOver={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >
                      <Paperclip size={18} />
                    </button>
                    {isAdminOrAgent && (
                      <>
                        <button
                          onClick={() => setIsInternal(!isInternal)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${isInternal ? 'bg-[var(--warning-subtle)] text-[var(--warning)] ' : ''}`}
                          style={{ color: !isInternal ? "var(--text-secondary)" : undefined }}
                          onMouseOver={e => { if(!isInternal) { e.currentTarget.style.background = "var(--surface-hover)"; } }}
                          onMouseOut={e => { if(!isInternal) { e.currentTarget.style.background = "transparent"; } }}
                        >
                          <LockKey size={16} />
                          {isInternal ? 'Internal Note ON' : 'Make Internal'}
                        </button>

                        <button
                          onClick={handleAiSuggest}
                          disabled={isSuggesting}
                          className="p-1.5 text-[var(--accent)] hover:bg-[var(--accent-subtle)] rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          <Sparkle size={16} />
                          {isSuggesting ? 'Thinking...' : 'AI Suggest Reply'}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleSendReply}
                    disabled={isSending || (isAdminOrAgent && ticket.status === "Resolved" && !isInternal) || (user?.role === "Agent" && ticket.assignedToId !== user.id && !isInternal) || !replyContent.trim()}
                    className={`
                      px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all
                      ${isSending || !replyContent.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                      ${isInternal ? 'bg-[var(--warning)] text-[var(--text-on-warning)] hover:bg-[var(--warning)]' : 'bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)]'}
                    `}
                  >
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                    <PaperPlaneRight size={16} weight={isSending ? 'regular' : 'fill'} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[var(--surface-bg)] border-t border-[var(--border-default)] text-center">
              <p className="text-[var(--text-secondary)] text-sm">This ticket is closed. You cannot send further replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
