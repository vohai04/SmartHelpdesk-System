import { Outlet } from "react-router-dom";
import { ChatsCircle, Ticket, CheckCircle, Users } from "@phosphor-icons/react";

export function AuthLayout() {
  return <div className="auth-shell"><aside className="auth-story"><div className="brand"><span className="brand-symbol"><ChatsCircle size={26} weight="fill"/></span><span>SmartDesk</span></div><div className="auth-story-content"><h1>Every request.<br/>A clear resolution.</h1><p>A focused workspace for the people who make support happen.</p><div className="auth-workflow"><div><Ticket size={22}/><span>Bring requests together</span></div><div><Users size={22}/><span>Keep your team in sync</span></div><div><CheckCircle size={22}/><span>Follow through to resolution</span></div></div></div><small>Built for everyday support.</small></aside><main className="auth-main"><div className="auth-mobile-brand brand"><span className="brand-symbol"><ChatsCircle size={22} weight="fill"/></span>SmartDesk</div><div className="auth-form"><Outlet/></div><p className="auth-copyright">&copy; {new Date().getFullYear()} SmartDesk</p></main></div>;
}
