import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/use-toast";
import { Eye, EyeSlash, CircleNotch } from "@phosphor-icons/react";

const loginSchema = z.object({
  email: z.string().email({ message: "Enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});
type LoginFormValues = z.infer<typeof loginSchema>;

const inputBase =
  "w-full h-9 px-3 rounded-md border text-[13px] bg-white outline-none transition-all duration-150 placeholder:text-[color:var(--text-disabled)] text-[color:var(--text-primary)]";
const inputNormal = `${inputBase} border-[color:var(--border-default)] focus:border-[color:var(--accent)] focus:ring-2 focus:ring-[color:var(--accent-border)]`;
const inputError  = `${inputBase} border-[color:var(--danger)] focus:border-[color:var(--danger)] focus:ring-2 focus:ring-[color:var(--danger-border)]`;

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate  = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading]   = useState(false);
  const [showPw, setShowPw]     = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const data = await authService.login(values);
      const token    = data.token    || data.Token;
      const userId   = data.userId   || data.UserId   || "";
      const email    = data.email    || data.Email    || "";
      const fullName = data.fullName || data.FullName || "";
      const role     = data.role     || data.Role     || "Customer";
      if (!token) throw new Error("No token");
      login(token, { id: userId, email, fullName, role });
      toast({ title: "Welcome back!", description: `Signed in as ${fullName}.` });
      navigate("/");
    } catch (err: unknown) {
      interface Resp { message?: string; Message?: string; Errors?: { ErrorMessage: string }[] }
      const d = (err as { response?: { data?: Resp } }).response?.data;
      const msg = d?.Errors?.map(e => e.ErrorMessage).join(", ") || d?.message || d?.Message || "Invalid email or password.";
      toast({ title: "Sign in failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[20px] font-semibold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Sign in
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
          Enter your credentials to access your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
            Email
          </label>
          <input
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={errors.email ? inputError : inputNormal}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[12px] font-medium" style={{ color: "var(--text-secondary)" }}>
              Password
            </label>
            <a
              href="#"
              className="text-[11px] font-medium transition-colors duration-150"
              style={{ color: "var(--accent)" }}
              onMouseOver={e => (e.currentTarget.style.color = "var(--accent-hover)")}
              onMouseOut={e => (e.currentTarget.style.color = "var(--accent)")}
            >
              Forgot password?
            </a>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              autoComplete="current-password"
              className={`${errors.password ? inputError : inputNormal} pr-10`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPw(p => !p)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded transition-colors duration-150"
              style={{ color: "var(--text-disabled)" }}
              tabIndex={-1}
            >
              {showPw ? <EyeSlash size={14} weight="regular" /> : <Eye size={14} weight="regular" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-9 flex items-center justify-center gap-2 rounded-md text-[13px] font-medium text-white transition-all duration-150 disabled:opacity-55 disabled:cursor-not-allowed"
          style={{
            background: loading ? "var(--text-tertiary)" : "var(--text-primary)",
            boxShadow: "var(--shadow-xs)",
          }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.background = "var(--text-secondary)"; }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.background = "var(--text-primary)"; }}
          onMouseDown={e => { e.currentTarget.style.transform = "scale(0.99)"; }}
          onMouseUp={e => { e.currentTarget.style.transform = "scale(1)"; }}
        >
          {loading ? <><CircleNotch size={14} className="animate-spin" />Signing in...</> : "Sign in"}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--text-tertiary)" }}>
        Don't have an account?{" "}
        <Link
          to="/auth/register"
          className="font-medium transition-colors duration-150"
          style={{ color: "var(--accent)" }}
        >
          Create account
        </Link>
      </p>
    </div>
  );
}
