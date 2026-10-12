import { useCallback, useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Plus, Ticket, Clock, CheckCircle, Sparkle, ArrowUpRight, WarningCircle } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { ticketService, type TicketDto } from "../../services/ticketService";
import { analyticsService, type DashboardMetricsDto } from "../../services/analyticsService";
import { signalRService } from "../../services/signalrService";
import { CreateTicketModal } from "../../components/tickets/CreateTicketModal";

const statusNames:Record<string,string>={Open:"Open",InProgress:"In progress",Resolved:"Resolved",Closed:"Closed"};
export function DashboardPage() {
  const requestId=useRef(0);
  const user=useAuthStore(s=>s.user);
  const customer=user?.role==="Customer";
  const [tickets,setTickets]=useState<TicketDto[]>([]);
  const [metrics,setMetrics]=useState<DashboardMetricsDto|null>(null);
  const [counts,setCounts]=useState({total:0,open:0,resolved:0});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  const load=useCallback(async(showLoading=true)=>{
    const sequence=++requestId.current;
    if(showLoading)setLoading(true);setError(false);
    try {
      const [queue,summary,open,resolved]=await Promise.all([
        ticketService.getTickets({pageNumber:1,pageSize:8}),
        customer?Promise.resolve(null):analyticsService.getDashboardMetrics(),
        customer?ticketService.getTickets({status:"Open",pageSize:1}):Promise.resolve(null),
        customer?ticketService.getTickets({status:"Resolved",pageSize:1}):Promise.resolve(null),
      ]);
      if(sequence!==requestId.current) return;
      setTickets(queue.items);setMetrics(summary);setCounts({total:queue.totalCount,open:open?.totalCount??0,resolved:resolved?.totalCount??0});
    }catch{if(sequence===requestId.current)setError(true);}finally{if(sequence===requestId.current)setLoading(false);}
  },[customer]);
  useEffect(()=>{let active=true;Promise.resolve().then(()=>{if(active)void load();});return()=>{active=false;};},[load]);
  useEffect(()=>{
    let timer:ReturnType<typeof setTimeout>;
    const refresh=()=>{clearTimeout(timer);timer=setTimeout(()=>{void load(false);},100);};
    const updates=signalRService.subscribeTicketUpdates(refresh);
    const reconnect=signalRService.subscribeReconnect(refresh);
    return()=>{clearTimeout(timer);updates();reconnect();};
  },[load]);
  const stats=customer?[
    {label:"Your requests",value:counts.total,icon:Ticket,note:"All your support tickets"},
    {label:"Open requests",value:counts.open,icon:Clock,note:"Waiting for a response"},
    {label:"Resolved",value:counts.resolved,icon:CheckCircle,note:"Requests with a resolution"},
  ]:[
    {label:"Total tickets",value:metrics?.totalTickets??0,icon:Ticket,note:"Across the workspace"},
    {label:"Open tickets",value:metrics?.openTickets??0,icon:Clock,note:`${metrics?.urgentTickets??0} marked urgent`},
    {label:"Resolution time",value:`${metrics?.averageResolutionTimeHours??0}h`,icon:CheckCircle,note:"Average time to resolve"},
    {label:"AI triage",value:`${metrics?.aiTriageRate??0}%`,icon:Sparkle,note:"Automatically classified"},
  ];
  return <div className="overview-page workspace-page">
    <div className="page-heading"><div><h1>{customer?"Your support overview":"Support overview"}</h1><p>Welcome back, {user?.fullName}. {customer?"Follow your requests and keep the conversation going.":"Here’s how your support queue is moving."}</p></div><button className="primary-button" onClick={()=>setCreateOpen(true)}><Plus size={18}/>New Ticket</button></div>
    {error?<div className="overview-error" role="alert"><WarningCircle size={22}/><div><strong>Could not load the overview</strong><p>Check your connection and try again.</p></div><button className="secondary-button" onClick={()=>void load()}>Try again</button></div>:<>
      <section className={`overview-metrics ${customer?"customer-metrics":""}`} aria-label="Support metrics">{stats.map(({label,value,icon:Icon,note})=><div className="metric" key={label}><div className="metric-label"><span>{label}</span><Icon size={20}/></div>{loading?<div className="skeleton h-10 w-20 my-3"/>:<strong className="metric-value">{value}</strong>}<small>{note}</small></div>)}</section>
      {!customer&&<div className="overview-breakdown"><section className="surface-section queue-health"><div className="overview-section-title"><div><h2>Queue health</h2><p>Requests by their current status.</p></div><span className="section-icon"><Ticket size={21}/></span></div><div className="status-distribution">{Object.entries(statusNames).map(([status,label])=>{const count=metrics?.ticketsByStatus[status]??0;return <div className="distribution-row" key={status}><span><i className={`status-dot ${status.toLowerCase()}`}/>{label}</span><div className="distribution-track"><div className={`distribution-fill ${status.toLowerCase()}`} style={{width:`${metrics?.totalTickets?count/metrics.totalTickets*100:0}%`}}/></div><strong>{loading?"—":count}</strong></div>;})}</div></section><section className="surface-section queue-priorities"><div className="overview-section-title"><div><h2>What needs attention</h2><p>Ticket priority across the queue.</p></div></div><div className="priority-distribution">{['Urgent','High','Medium','Low','Unclassified'].map(priority=><div key={priority}><span className={`priority-mark ${priority.toLowerCase()}`}/><span>{priority==="Unclassified"?"Awaiting classification":`${priority} priority`}</span><strong>{loading?"—":metrics?.ticketsByPriority[priority]??0}</strong></div>)}</div></section></div>}
      <section className="surface-section recent-requests"><div className="overview-section-title"><div><h2>Recent requests</h2><p>The latest conversations in your workspace.</p></div><Link className="text-link" to="/tickets">View all<ArrowUpRight size={16}/></Link></div><div className="request-list">{loading?Array.from({length:4},(_,i)=><div className="request-row" key={i}><div className="skeleton h-9 w-full"/></div>):tickets.length?tickets.map(t=><Link className="request-row" to={`/tickets/${t.id}`} key={t.id}><span className="request-symbol"><Ticket size={20}/></span><div className="request-title"><strong>{t.title}</strong><small>#{t.id.slice(0,8)} <span>{t.categoryName}</span></small></div><span className={`request-status ${t.status.toLowerCase()}`}>{statusNames[t.status]??t.status}</span><span className="request-date">{new Date(t.createdAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span><ArrowUpRight className="request-arrow" size={17}/></Link>):<div className="overview-empty"><Ticket size={32}/><h3>No requests yet</h3><p>Create a ticket when you need help. You can track replies here.</p><button className="secondary-button" onClick={()=>setCreateOpen(true)}>Create a request</button></div>}</div></section>
    </>}
    <CreateTicketModal open={createOpen} onOpenChange={setCreateOpen} onSuccess={()=>void load()}/>
  </div>;
}
