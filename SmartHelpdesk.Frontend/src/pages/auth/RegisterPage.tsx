import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../hooks/use-toast";
import { Eye, EyeSlash, CircleNotch } from "@phosphor-icons/react";

const schema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});
type FormValues = z.infer<typeof schema>;

const inputBase = "w-full h-9 px-3 rounded-md border text-[13px] bg-white outline-none transition-all duration-150 placeholder:text-[color:var(--text-disabled)] text-[color:var(--text-primary)]";
const inputNormal = `${inputBase} border-[color:var(--border-default)] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-border)]`;
const inputError  = `${inputBase} border-[color:var(--danger)] focus:border-[color:var(--danger)] focus:ring-2 focus:ring-[color:var(--danger-border)]`;

export function RegisterPage() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [loading, setLoading]         = useState(false);
  const [showPw, setShowPw]           = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      const data = await authService.register({ fullName: values.fullName, email: values.email, password: values.password });
      const token    = data.token    || data.Token;
      const userId   = data.userId   || data.UserId   || "";
      const email    = data.email    || data.Email    || "";
      const fullName = data.fullName || data.FullName || "";
      const role     = data.role     || data.Role     || "Customer";
      if (token) {
        login(token, { id: userId, email, fullName, role });
        navigate("/");
      } else {
        navigate("/auth/login");
      }
      toast({ title: "Account created!", description: "Welcome to SmartDesk." });
    } catch (err: unknown) {
      interface Resp { message?: string; Message?: string; Errors?: { ErrorMessage: string }[] }
      const d = (err as { response?: { data?: Resp } }).response?.data;
      const msg = d?.Errors?.map(e => e.ErrorMessage).join(", ") || d?.message || d?.Message || "Registration failed.";
      toast({ title: "Registration failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const field = (name: keyof FormValues) => ({
    className: errors[name] ? inputError : inputNormal,
    ...register(name),
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Create account
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Get started with SmartDesk today.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Full name</label>
          <input placeholder="John Smith" autoComplete="name" {...field("fullName")} />
          {errors.fullName && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.fullName.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
          <input type="email" placeholder="you@company.com" autoComplete="email" {...field("email")} />
          {errors.email && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password" {...field("password")} className={`${errors.password ? inputError : inputNormal} pr-10`} />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: "var(--text-disabled)" }} tabIndex={-1}>
              {showPw ? <EyeSlash size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.password && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>Confirm password</label>
          <div className="relative">
            <input type={showConfirmPw ? "text" : "password"} placeholder="Repeat password" autoComplete="new-password" {...field("confirmPassword")} className={`${errors.confirmPassword ? inputError : inputNormal} pr-10`} />
            <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded" style={{ color: "var(--text-disabled)" }} tabIndex={-1}>
              {showConfirmPw ? <EyeSlash size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-md text-[13px] font-medium text-white transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed"
          style={{ background: "var(--text-primary)", boxShadow: "var(--shadow-xs)" }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.background = "var(--text-secondary)"; }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.background = "var(--text-primary)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.99)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? <><CircleNotch size={14} className="animate-spin" />Creating account...</> : "Create account"}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        Already have an account?{" "}
        <Link to="/auth/login" className="font-medium" style={{ color: "var(--accent)" }}>Sign in</Link>
      </p>
    </div>
  );
}
