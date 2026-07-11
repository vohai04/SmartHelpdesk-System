import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  PaperPlaneRight, 
  Sparkle, 
  LockKey,
  Paperclip,
  User,
  CheckCircle,
  Tag,
  X,
  MagnifyingGlass
} from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto, type TicketMessageDto, type AgentDto } from "../../services/ticketService";
import { signalRService } from "../../services/signalrService";
import { useToast } from "../../hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";

// ─── Badges ───────────────────────────────────────────────────────────────────
const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Open:       { bg: "var(--accent-subtle)",   color: "var(--accent)",   border: "var(--accent-border)" },
  InProgress: { bg: "#fef3c7",                color: "#d97706",         border: "#fde68a" },
  Resolved:   { bg: "var(--success-subtle)",  color: "var(--success)",  border: "var(--success-border)" },
  Closed:     { bg: "var(--surface-bg)",      color: "var(--text-tertiary)", border: "var(--border-strong)" },
};

const PRIORITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Low:        { bg: "var(--surface-bg)",      color: "var(--text-secondary)", border: "var(--border-default)" },
  Medium:     { bg: "var(--accent-subtle)",   color: "var(--accent)",         border: "var(--accent-border)" },
  High:       { bg: "#fee2e2",                color: "#b91c1c",               border: "#fecaca" },
  Urgent:     { bg: "#7f1d1d",                color: "#fef2f2",               border: "#ef4444" },
};

const getAbsoluteUrl = (url: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const baseUrl = (import.meta.env.VITE_API_URL || 'https://localhost:7055/api').replace('/api', '');
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<TicketDto | null>(null);
  const [messages, setMessages] = useState<TicketMessageDto[]>([]);
  const [agents, setAgents] = useState<AgentDto[]>([]);
  const [searchAgent, setSearchAgent] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isAdminOrAgent = user?.role === "Admin" || user?.role === "Agent";

  const loadTicketData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [ticketData, messageData] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getMessages(id, 1, 100)
      ]);
      setTicket(ticketData);
      setMessages(messageData.items);
      
      if (isAdminOrAgent) {
        const agentList = await ticketService.getAgents();
        setAgents(agentList);
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to load ticket details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicketData();
  }, [id]);

  useEffect(() => {
    if (window.location.hash) {
      const targetId = window.location.hash.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        // Optional: highlight effect
        const originalBg = element.style.backgroundColor;
        element.style.backgroundColor = 'var(--indigo-50, #eef2ff)';
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
    const unsubscribe = signalRService.subscribe((_title, _message) => {
      // Check if this notification is relevant to the current ticket,
      // or just safely reload the messages stream
      if (id) {
        ticketService.getTicketById(id).then(data => {
          setTicket(data);
        }).catch(console.error);

        ticketService.getMessages(id, 1, 100).then(data => {
          setMessages(data.items);
        }).catch(console.error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [id]);

  const handleUpdateTicket = async (field: string, value: string | null) => {
    if (!id || !ticket) return;
    try {
      const payload = { [field]: value };
      await ticketService.updateTicket(id, payload);
      
      let updatedTicket = { ...ticket, [field]: value } as TicketDto;
      if (field === "assignedToId") {
        if (value === "00000000-0000-0000-0000-000000000000" || value === null) {
            updatedTicket.assignedToName = undefined;
        } else {
            const agent = agents.find(a => a.id === value);
            if (agent) {
                updatedTicket.assignedToName = agent.fullName;
            } else if (value === user?.id) {
                updatedTicket.assignedToName = user?.fullName;
            }
        }
      }
      
      setTicket(updatedTicket);
      toast({ title: "Updated", description: `Ticket ${field} updated successfully.` });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: `Failed to update ${field}`, variant: "destructive" });
    }
  };

  const handleSendReply = async () => {
    if (!id || (!replyContent.trim() && selectedFiles.length === 0)) return;
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
    return <div className="p-8 text-center text-slate-500">Loading ticket details...</div>;
  }

  if (!ticket) {
    return <div className="p-8 text-center text-red-500">Ticket not found</div>;
  }

  return (
    <div 
      className="flex flex-col rounded-xl overflow-hidden shadow-sm" 
      style={{ 
        height: "calc(100vh - 120px)", 
        background: "var(--surface-bg)",
        border: "1px solid var(--border-default)"
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <button 
          onClick={() => navigate('/tickets')}
          className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-900 truncate">{ticket.title}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: STATUS_STYLE[ticket.status]?.bg, color: STATUS_STYLE[ticket.status]?.color, border: `1px solid ${STATUS_STYLE[ticket.status]?.border}` }}>
              {ticket.status}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: PRIORITY_STYLE[ticket.priority]?.bg, color: PRIORITY_STYLE[ticket.priority]?.color, border: `1px solid ${PRIORITY_STYLE[ticket.priority]?.border}` }}>
              {ticket.priority}
            </span>
          </div>
          <p className="text-sm text-slate-500 flex items-center gap-2">
            <span>Ticket #{ticket.id.split('-')[0].toUpperCase()}</span>
            <span>•</span>
            <span>Created by {ticket.createdByName} on {new Date(ticket.createdAt).toLocaleDateString()}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Info */}
        <div className="w-80 border-r border-slate-200 bg-slate-50 overflow-y-auto shrink-0 hidden md:block">
          <div className="p-5 space-y-6">
            
            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Description</h3>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">
                {ticket.description}
              </div>
            </div>

            {/* AI Insights (Hidden from Customers) */}
            {isAdminOrAgent && ticket.isAiTriaged && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Sparkle size={14} className="text-indigo-500" />
                  AI Triage
                </h3>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Sentiment:</span>
                    <span className="font-medium text-indigo-700 capitalize">{ticket.aiSentiment || 'Neutral'}</span>
                  </div>
                  {ticket.aiSummary && (
                    <div className="pt-2 border-t border-indigo-100 text-[13px] text-indigo-900/80 leading-relaxed">
                      <span className="font-semibold block mb-1">Summary:</span>
                      {ticket.aiSummary}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Details */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Details</h3>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                <div className="p-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><Tag size={16} /> Category</span>
                  <span className="font-medium text-slate-900">{ticket.categoryName}</span>
                </div>
                <div className="p-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500 flex items-center gap-2"><User size={16} /> Assignee</span>
                  {user?.role === 'Admin' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded-md transition-colors outline-none cursor-pointer">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700 font-bold">
                            {ticket.assignedToName ? ticket.assignedToName.charAt(0).toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-900 text-xs truncate max-w-[100px]">{ticket.assignedToName || 'Unassigned'}</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[240px] max-h-[300px] overflow-y-auto">
                        <DropdownMenuLabel>Assign Ticket</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-2 border-b border-slate-100 sticky top-0 bg-white z-10">
                          <div className="relative flex items-center">
                            <MagnifyingGlass className="absolute left-2.5 text-slate-400" size={14} />
                            <input 
                              type="text" 
                              placeholder="Search agent..." 
                              value={searchAgent}
                              onChange={e => setSearchAgent(e.target.value)}
                              onClick={e => e.stopPropagation()}
                              onKeyDown={e => e.stopPropagation()}
                              className="w-full h-8 pl-8 pr-2.5 rounded-md text-[12px] outline-none bg-slate-50/50 hover:bg-slate-100 focus:bg-slate-100 transition-colors text-slate-700 placeholder:text-slate-400"
                              autoFocus
                            />
                          </div>
                        </div>
                        <DropdownMenuItem onClick={() => handleUpdateTicket("assignedToId", "00000000-0000-0000-0000-000000000000")}>
                          <span className="text-slate-500 italic">Unassigned</span>
                        </DropdownMenuItem>
                        {agents
                          .filter(a => a.fullName.toLowerCase().includes(searchAgent.toLowerCase()) || a.email.toLowerCase().includes(searchAgent.toLowerCase()))
                          .map(a => (
                          <DropdownMenuItem key={a.id} onClick={() => handleUpdateTicket("assignedToId", a.id)}>
                            <Avatar className="h-5 w-5 mr-2">
                              <AvatarFallback className="text-[8px] bg-indigo-100 text-indigo-700">{a.fullName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="truncate flex-1">{a.fullName}</span>
                          </DropdownMenuItem>
                        ))}
                        {searchAgent && agents.filter(a => a.fullName.toLowerCase().includes(searchAgent.toLowerCase()) || a.email.toLowerCase().includes(searchAgent.toLowerCase())).length === 0 && (
                          <div className="px-2 py-3 text-center text-xs text-slate-400">No agents found</div>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                  {user?.role === 'Agent' && (
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 ml-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700 font-bold">
                            {ticket.assignedToName ? ticket.assignedToName.charAt(0).toUpperCase() : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-slate-900 text-xs truncate max-w-[120px]" title={ticket.assignedToName || 'Unassigned'}>{ticket.assignedToName || 'Unassigned'}</span>
                      </div>
                      {ticket.assignedToId === user.id ? (
                        <button onClick={() => handleUpdateTicket("assignedToId", "00000000-0000-0000-0000-000000000000")} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-md transition-colors w-full text-center">
                          Unassign
                        </button>
                      ) : (!ticket.assignedToId || ticket.assignedToId === "00000000-0000-0000-0000-000000000000") ? (
                        <button onClick={() => handleUpdateTicket("assignedToId", user.id)} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors w-full text-center">
                          Assign to me
                        </button>
                      ) : null}
                    </div>
                  )}
                  {user?.role === 'Customer' && (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-slate-200 text-slate-700 font-bold">
                          {ticket.assignedToName ? ticket.assignedToName.charAt(0).toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-slate-900 text-xs">{ticket.assignedToName || 'Unassigned'}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            {isAdminOrAgent && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Management</h3>
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                    <select 
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                      value={ticket.status}
                      onChange={(e) => handleUpdateTicket("status", e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="InProgress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Priority</label>
                    <select 
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                      value={ticket.priority}
                      onChange={(e) => handleUpdateTicket("priority", e.target.value)}
                    >
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
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* Thread */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400">
                <CheckCircle size={48} weight="light" className="mb-4 text-slate-300" />
                <p>No messages yet.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.senderId === user?.id;
                
                return (
                  <div key={msg.id} id={`msg-${msg.id}`} className={`flex gap-4 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''} p-2 rounded-xl transition-colors`}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-1" style={{ background: isMe ? '#2563eb' : '#64748b' }}>
                      {msg.senderName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-baseline gap-2 mb-1 px-1">
                        <span className="text-xs font-medium text-slate-700">{msg.senderName}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      
                      <div className={`
                        relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed
                        ${msg.isInternalNote 
                          ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-sm' 
                          : isMe 
                            ? 'bg-blue-600 text-white rounded-tr-sm shadow-sm' 
                            : 'bg-slate-100 text-slate-800 rounded-tl-sm border border-slate-200'
                        }
                      `}>
                        {msg.isInternalNote && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">
                            <LockKey size={12} weight="bold" /> Internal Note
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.attachments.map(att => (
                              att.contentType.startsWith('image/') ? (
                                <a key={att.id} href={getAbsoluteUrl(att.fileUrl)} target="_blank" rel="noopener noreferrer" className="block border border-slate-200 rounded-lg overflow-hidden hover:opacity-90 transition-opacity">
                                  <img src={getAbsoluteUrl(att.fileUrl)} alt={att.fileName} className="h-20 object-cover max-w-[150px]" />
                                </a>
                              ) : (
                                <a key={att.id} href={getAbsoluteUrl(att.fileUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                                  <Paperclip size={14} />
                                  <span className="truncate max-w-[120px]">{att.fileName}</span>
                                </a>
                              )
                            ))}
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
            <div className="p-4 border-t border-slate-200 bg-slate-50">
              <div className={`
                bg-white border rounded-xl overflow-hidden transition-colors
                ${isInternal ? 'border-amber-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-100' : 'border-slate-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'}
              `}>
                {isInternal && (
                  <div className="bg-amber-50 px-3 py-1.5 border-b border-amber-100 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <LockKey size={14} /> 
                    Private Internal Note (Only visible to Agents)
                  </div>
                )}
                <textarea 
                  className="w-full p-4 text-sm outline-none resize-none min-h-[100px] bg-transparent"
                  placeholder={isInternal ? "Write an internal note..." : "Type your reply..."}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                
                {selectedFiles.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
                        <Paperclip size={12} className="text-slate-500" />
                        <span className="truncate max-w-[120px]" title={f.name}>{f.name}</span>
                        <button onClick={() => removeFile(i)} className="ml-1 text-slate-400 hover:text-red-500 transition-colors">
                          <X size={12} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="px-3 py-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
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
                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      <Paperclip size={18} />
                    </button>
                    {isAdminOrAgent && (
                      <>
                        <button 
                          onClick={() => setIsInternal(!isInternal)}
                          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium ${isInternal ? 'bg-amber-100 text-amber-700' : 'text-slate-500 hover:bg-slate-200'}`}
                        >
                          <LockKey size={16} />
                          {isInternal ? 'Internal Note ON' : 'Make Internal'}
                        </button>
                        
                        <button 
                          onClick={handleAiSuggest}
                          disabled={isSuggesting}
                          className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                        >
                          <Sparkle size={16} />
                          {isSuggesting ? 'Thinking...' : 'AI Suggest Reply'}
                        </button>
                      </>
                    )}
                  </div>
                  
                  <button 
                    onClick={handleSendReply}
                    disabled={isSending || (!replyContent.trim() && selectedFiles.length === 0)}
                    className={`
                      px-4 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium text-white transition-all
                      ${isSending || (!replyContent.trim() && selectedFiles.length === 0) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                      ${isInternal ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'}
                    `}
                  >
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                    <PaperPlaneRight size={16} weight={isSending ? 'regular' : 'fill'} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-center">
              <p className="text-slate-500 text-sm">This ticket is closed. You cannot send further replies.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
