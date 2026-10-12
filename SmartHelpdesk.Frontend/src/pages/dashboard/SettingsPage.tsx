import { useRef, useState } from "react";
import { UserCircle, LockKey, PencilSimple } from "@phosphor-icons/react";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../hooks/use-toast";
import { EditProfileModal } from "../../components/profile/EditProfileModal";
import { ChangePasswordModal } from "../../components/profile/ChangePasswordModal";

export function SettingsPage() {
  const user = useAuthStore(s => s.user);
  const { toast } = useToast();
  const editTrigger = useRef<HTMLButtonElement>(null);
  const passwordTrigger = useRef<HTMLButtonElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  return (
    <div className="account-page workspace-page">
      <div className="page-heading"><div><h1>Settings</h1><p>Manage your personal information and account security.</p></div></div>
      <section className="settings-summary surface-section" aria-labelledby="personal-heading">
        <div className="settings-summary-heading"><span className="section-icon"><UserCircle size={25}/></span><div><h2 id="personal-heading">Personal information</h2><p>Your display name appears on tickets and conversations.</p></div></div>
        <dl className="settings-summary-details"><div><dt>Full name</dt><dd>{user?.fullName}</dd></div><div><dt>Email address</dt><dd>{user?.email}</dd></div><div><dt>Role</dt><dd>{user?.role === "Admin" ? "Administrator" : user?.role === "Agent" ? "Support agent" : user?.role}</dd></div></dl>
        <div className="settings-summary-footer"><p>Your email address cannot be changed.</p><button ref={editTrigger} className="secondary-button" onClick={() => setEditOpen(true)}><PencilSimple size={17}/>Edit profile</button></div>
      </section>
      <section className="settings-summary surface-section" aria-labelledby="security-heading">
        <div className="settings-summary-heading"><span className="section-icon"><LockKey size={25}/></span><div><h2 id="security-heading">Password &amp; security</h2><p>Choose a password you do not use on other accounts.</p></div></div>
        <div className="settings-summary-footer"><p>Update your password in a secure form.</p><button ref={passwordTrigger} className="secondary-button" onClick={() => setPasswordOpen(true)}>Change password</button></div>
      </section>
      {editOpen && <EditProfileModal onReturnFocus={() => editTrigger.current?.focus()} open={editOpen} onOpenChange={setEditOpen} onSuccess={() => toast({title:"Profile updated",description:"Your account details have been saved."})}/>}
      {passwordOpen && <ChangePasswordModal onReturnFocus={() => passwordTrigger.current?.focus()} open={passwordOpen} onOpenChange={setPasswordOpen} onSuccess={() => toast({title:"Password changed",description:"Your new password is ready to use."})}/>}
    </div>
  );
}
