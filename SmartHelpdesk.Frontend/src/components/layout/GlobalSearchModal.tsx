import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Ticket, X } from "@phosphor-icons/react";
import { ticketService, type TicketDto } from "../../services/ticketService";
import * as Dialog from "@radix-ui/react-dialog";

export function GlobalSearchModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<TicketDto[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setKeyword("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await ticketService.getTickets({ keyword, pageSize: 5 });
        setResults(res.items);
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(t);
  }, [keyword]);

  const handleSelect = (id: string) => {
    onOpenChange(false);
    navigate(`/tickets/${id}`);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200" />
        <Dialog.Content
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[500px] bg-white rounded-xl shadow-2xl z-[101] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
          style={{ border: "1px solid #e7e5e4" }}
        >
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-stone-200">
            <MagnifyingGlass size={20} className="text-stone-400 mr-3 flex-shrink-0" />
            <input
              ref={inputRef}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search tickets by title or description..."
              className="flex-1 bg-transparent outline-none text-[15px] text-stone-900 placeholder-stone-400"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="ml-2 p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 max-h-[350px] overflow-y-auto p-2 bg-stone-50">
            {!keyword.trim() ? (
              <div className="py-10 text-center text-[13px] text-stone-500">
                Type something to search...
              </div>
            ) : loading ? (
              <div className="py-10 text-center text-[13px] text-stone-500">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-1">
                {results.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => handleSelect(ticket.id)}
                    className="w-full flex flex-col text-left px-3 py-2.5 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-stone-200 transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[14px] font-medium text-stone-900 truncate">
                        {ticket.title}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0 ml-2"
                        style={{
                          background: ticket.status === "Resolved" ? "#dcfce7" : "#f1f5f9",
                          color: ticket.status === "Resolved" ? "#166534" : "#475569",
                        }}
                      >
                        {ticket.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-stone-500">
                      <Ticket size={12} />
                      <span className="truncate">By {ticket.createdByName}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-[13px] text-stone-500">
                No tickets found for "{keyword}"
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
