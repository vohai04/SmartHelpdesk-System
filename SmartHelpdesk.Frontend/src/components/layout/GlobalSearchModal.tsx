import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Ticket, X, CircleNotch } from "@phosphor-icons/react";
import * as Dialog from "@radix-ui/react-dialog";
import { ticketService, type TicketDto } from "../../services/ticketService";

function SearchContent({close}:{close:()=>void}) {
  const [keyword,setKeyword]=useState("");
  const [results,setResults]=useState<TicketDto[]>([]);
  const [loading,setLoading]=useState(false);
  const [failed,setFailed]=useState(false);
  const navigate=useNavigate();
  useEffect(()=>{
    if(!keyword.trim())return;
    let active=true;
    const timer=setTimeout(async()=>{try{const result=await ticketService.getTickets({keyword,pageSize:6});if(active)setResults(result.items);}catch{if(active)setFailed(true);}finally{if(active)setLoading(false);}},300);
    return()=>{active=false;clearTimeout(timer);};
  },[keyword]);
  return <Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content className="search-dialog"><Dialog.Title className="sr-only">Search tickets</Dialog.Title><Dialog.Description className="sr-only">Find a ticket by its title or description.</Dialog.Description><div className="search-dialog-input"><MagnifyingGlass size={22}/><input autoFocus value={keyword} onChange={e=>{setKeyword(e.target.value);setResults([]);setLoading(!!e.target.value.trim());setFailed(false);}} placeholder="Search tickets by title or description..." aria-label="Search tickets by title or description"/><Dialog.Close className="icon-button" aria-label="Close search"><X size={20}/></Dialog.Close></div><div className="search-results">{!keyword.trim()?<p>Search your workspace’s support requests.</p>:loading?<p><CircleNotch size={20} className="animate-spin"/>Searching tickets…</p>:failed?<p>Search could not load. Try another search.</p>:results.length?results.map(t=><button key={t.id} onClick={()=>{close();navigate(`/tickets/${t.id}`);}}><Ticket size={21}/><span><strong>{t.title}</strong><small>#{t.id.slice(0,8)} / {t.status}</small></span></button>):<p>No tickets match your search.</p>}</div><div className="search-footer">Press Escape to close</div></Dialog.Content></Dialog.Portal>;
}
export function GlobalSearchModal({open,onOpenChange}:{open:boolean;onOpenChange:(open:boolean)=>void}) {return <Dialog.Root open={open} onOpenChange={onOpenChange}>{open&&<SearchContent close={()=>onOpenChange(false)}/>}</Dialog.Root>;}
