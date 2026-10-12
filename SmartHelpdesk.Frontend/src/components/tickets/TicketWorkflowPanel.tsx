import { useState, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { isAxiosError } from "axios";
import { X } from "@phosphor-icons/react";
import { ticketService, type TicketDto, type AgentDto } from "../../services/ticketService";
import { useAuthStore } from "../../store/authStore";

type Action = { key: string; label: string; reason?: boolean; target?: boolean };
export function TicketWorkflowPanel({ticket, agents, onUpdate, onArchived}: {ticket:TicketDto;agents:AgentDto[];onUpdate:(ticket:TicketDto)=>void;onArchived:()=>void}) {
  const user=useAuthStore(s=>s.user);
  const [action,setAction]=useState<Action|null>(null);
  const [reason,setReason]=useState("");
  const [target,setTarget]=useState("");
  const [search,setSearch]=useState("");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [choices,setChoices]=useState(agents);
  const [choicesLoading,setChoicesLoading]=useState(false);
  const [choicesError,setChoicesError]=useState("");
  const trigger=useRef<HTMLButtonElement|null>(null);
  const admin=user?.role==="Admin", customer=user?.role==="Customer";
  const owner=admin || ticket.assignedToId===user?.id;
  const active=ticket.status!=="Closed" && ticket.status!=="Resolved";
  const pending=!!ticket.transferRequestedAt;
  const actions:Action[]=[];
  if(!customer && active) {
    if(admin) actions.push({key:"Assign",label:ticket.assignedToId?"Reassign ticket":"Assign ticket",target:true,reason:!!ticket.assignedToId});
    else if(!ticket.assignedToId) actions.push({key:"Claim",label:"Assign to me"});
    if(owner && ticket.assignedToId) {
      if(ticket.status==="Open") actions.push({key:"Start",label:"Start work"});
      if(ticket.status==="Open" && !ticket.startedAt) actions.push({key:"ReturnToQueue",label:"Return to queue",reason:true});
      if(!pending) actions.push({key:"RequestTransfer",label:"Request handover",target:true,reason:true});
      if(ticket.status==="InProgress") actions.push({key:"WaitForCustomer",label:"Request customer information",reason:true});
      if(ticket.status==="InProgress" || ticket.status==="WaitingForCustomer") actions.push({key:"Resolve",label:"Resolve ticket",reason:true});
    }
    if(pending && (admin || ticket.transferTargetId===user?.id)) actions.push({key:"AcceptTransfer",label:"Accept handover",target:admin},{key:"RejectTransfer",label:"Reject handover",reason:true});
    if(pending && (admin || ticket.transferRequestedById===user?.id)) actions.push({key:"CancelTransfer",label:"Cancel handover",reason:true});
  }
  if(ticket.status==="Resolved" && (customer || admin)) actions.push({key:"ConfirmResolution",label:"Confirm resolution"});
  if((ticket.status==="Resolved" || ticket.status==="Closed") && (customer || owner)) actions.push({key:"Reopen",label:"Reopen ticket",reason:true});
  if(admin && ticket.status==="Closed") actions.push({key:"Archive",label:"Archive ticket"});
  if(admin && ticket.status!=="Closed") actions.push({key:"Close",label:"Close with reason",reason:true});
  if(customer && ticket.status!=="Closed") actions.push({key:"Withdraw",label:"Withdraw request",reason:true});
  async function submit(e:React.FormEvent) {
    e.preventDefault(); if(!action || busy)return;
    setBusy(true);setError("");
    try {
      if(action.key==="Archive") {await ticketService.deleteTicket(ticket.id);onArchived();return;}
      const result=await ticketService.action(ticket.id,{action:action.key,expectedVersion:ticket.version,reason:reason.trim() || undefined,assignedToId:target || null});
      onUpdate(result);setAction(null);
    } catch(err) {
      setError(isAxiosError(err)?err.response?.data?.Message || err.response?.data?.message || "Could not save. Try again.":"Could not save. Try again.");
      if(isAxiosError(err) && err.response?.status===409) {
        try {onUpdate(await ticketService.getTicketById(ticket.id));} catch { /* Keep the failed form available for retry. */ }
      }
    } finally {setBusy(false);}
  }
  return <section className="rounded-xl p-4 space-y-3 border border-[var(--border-default)] bg-[var(--surface-default)] text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-[var(--text-secondary)]">Responsible agent</span><span className="font-medium text-[var(--text-primary)] break-words">{ticket.assignedToName || "Unassigned"}</span></div>
    {pending && !customer && <div className="rounded-lg p-3 bg-[var(--warning-subtle)] text-[var(--text-primary)]"><p className="font-medium">Handover awaiting acceptance</p><p className="mt-1 break-words">{ticket.transferReason}</p><p className="mt-2 text-sm">Receiving agent: {ticket.transferTargetId ? agents.find(a=>a.id===ticket.transferTargetId)?.fullName || "Unavailable agent — Admin review needed" : "Admin coordination"}</p><p className="mt-2 text-xs">Requested {ticket.transferRequestedAt ? new Date(ticket.transferRequestedAt).toLocaleString():""}. The current agent remains responsible.</p></div>}
    {ticket.resolution && <p className="break-words"><strong>Resolution: </strong>{ticket.resolution}</p>}
    {ticket.closureReason && <p className="break-words"><strong>Closure: </strong>{ticket.closureReason}</p>}
    <div className="flex flex-wrap gap-2">{actions.map(a=><button key={a.key} className="px-3 py-2 rounded-lg border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-bg)] disabled:opacity-50" disabled={busy} onClick={e=>{trigger.current=e.currentTarget;setAction(a);setReason("");setSearch("");setTarget(a.key==="AcceptTransfer"?ticket.transferTargetId || "":"");setError("");setChoicesError("");if(a.target){setChoicesLoading(true);void ticketService.getAgents().then(setChoices).catch(()=>setChoicesError("Could not load agents. Close and reopen this dialog to retry.")).finally(()=>setChoicesLoading(false));}}}>{a.label}</button>)}</div>
    <Dialog.Root open={!!action} onOpenChange={open=>{if(!open && !busy)setAction(null);}}><Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 bg-black/50" style={{zIndex:"var(--z-modal,300)"}} />
      <Dialog.Content onCloseAutoFocus={e=>{e.preventDefault();trigger.current?.focus();}} className="workspace-dialog fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[480px] rounded-2xl border border-[var(--border-default)] bg-[var(--surface-default)] text-[var(--text-primary)] p-5" style={{zIndex:"var(--z-modal,300)",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <div className="flex items-center justify-between gap-3"><Dialog.Title className="text-lg font-semibold">{action?.label}</Dialog.Title><Dialog.Close aria-label="Close dialog" disabled={busy} className="p-2 rounded-lg"><X size={20}/></Dialog.Close></div>
        <Dialog.Description className="text-sm text-[var(--text-secondary)] mt-2">{action?.key==="RequestTransfer"?"You remain responsible until another agent accepts. Include progress and next steps.":action?.key==="Assign" && ticket.assignedToId?"Admin reassignment takes effect immediately. Include the reason for overriding ownership.":action?.key==="Archive"?"This closed ticket will leave the active queue. Its history and audit records will be retained.":"Review the details before confirming this action."}</Dialog.Description>
        <form onSubmit={submit} className="flex flex-col flex-1 min-h-0 gap-4 mt-5">
          <div className="space-y-4 overflow-y-auto min-h-0 flex-1">
          {action?.target && <div className="space-y-2"><label htmlFor="handover-search" className="block text-sm font-medium">Find an agent</label><input id="handover-search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name or email" className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-bg)] p-3 text-base"/><label htmlFor="handover-target" className="block text-sm font-medium">Receiving agent</label><select id="handover-target" value={target} onChange={e=>setTarget(e.target.value)} required={action.key!=="RequestTransfer"} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-default)] p-3 text-base"><option value="">{action.key==="RequestTransfer"?"Ask Admin to coordinate":"Choose an agent"}</option>{choices.filter(a=>(action.key!=="RequestTransfer" || a.id!==ticket.assignedToId) && (a.fullName+" "+a.email).toLocaleLowerCase().includes(search.toLocaleLowerCase())).map(a=><option key={a.id} value={a.id}>{a.fullName}</option>)}</select>{search && !choices.some(a=>(a.fullName+" "+a.email).toLocaleLowerCase().includes(search.toLocaleLowerCase())) && <p className="text-sm text-[var(--text-secondary)]">No agents found.</p>}</div>}
          {action?.reason && <div><label htmlFor="handover-reason" className="block text-sm font-medium mb-2">{action.key==="Resolve"?"Resolution shared with the customer":action.key==="WaitForCustomer"?"Information request shared with the customer":"Reason / handover notes"}</label><textarea id="handover-reason" required minLength={3} maxLength={2000} value={reason} onChange={e=>setReason(e.target.value)} rows={4} className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-bg)] p-3 text-base"/></div>}
          {choicesLoading && <p role="status" className="text-sm">Loading agents…</p>}
          {choicesError && <p role="alert" className="text-sm text-[var(--danger)]">{choicesError}</p>}
          {error && <p role="alert" className="text-sm text-[var(--danger)]">{error}</p>}
          </div>
          <div className="flex justify-end gap-2 shrink-0"><Dialog.Close disabled={busy} className="px-4 py-2 rounded-lg border border-[var(--border-default)]">Cancel</Dialog.Close><button type="submit" disabled={busy || choicesLoading || !!choicesError || (action?.reason && reason.trim().length<3) || (action?.target && action.key!=="RequestTransfer" && !target)} className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">{busy?"Saving…":"Confirm"}</button></div>
        </form>
      </Dialog.Content>
    </Dialog.Portal></Dialog.Root>
  </section>;
}
