import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { useToast } from "../../hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const data = await authService.register({ fullName: values.fullName, email: values.email, password: values.password });
      const safeToken    = data.token    || data.Token;
      const safeUserId   = data.userId   || data.UserId   || "";
      const safeEmail    = data.email    || data.Email    || "";
      const safeFullName = data.fullName || data.FullName || "";
      const safeRole     = data.role     || data.Role     || "Customer";

      if (safeToken) {
        login(safeToken, { id: safeUserId, email: safeEmail, fullName: safeFullName, role: safeRole });
        navigate("/");
      } else {
        navigate("/auth/login");
      }
      toast({ title: "Account created!", description: "Welcome to SmartDesk." });
    } catch (error: unknown) {
      interface ApiErrorResponse { message?: string; Message?: string; Detailed?: string; Errors?: Array<{ ErrorMessage: string }>; }
      const err = error as { response?: { data?: ApiErrorResponse } };
      const d = err.response?.data;
      const errorMsg = d?.Errors?.map(e => e.ErrorMessage).join(", ") || d?.message || d?.Message || d?.Detailed || "Registration failed. Please try again.";
      toast({ title: "Registration failed", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `w-full h-[38px] px-3 text-[13px] bg-white border rounded-lg outline-none transition-all placeholder:text-gray-400 text-gray-900 ${
      hasError ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
    }`;

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Create account</h1>
        <p className="text-[13px] text-gray-500 mt-1">Get started with SmartDesk for free.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Full name</label>
          <input placeholder="John Doe" autoComplete="name" className={inputClass(!!errors.fullName)} {...register("fullName")} />
          {errors.fullName && <p className="text-[12px] text-red-500 mt-1.5">{errors.fullName.message}</p>}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
          <input type="email" placeholder="you@company.com" autoComplete="email" className={inputClass(!!errors.email)} {...register("email")} />
          {errors.email && <p className="text-[12px] text-red-500 mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Password</label>
          <div className="relative">
            <input type={showPw ? "text" : "password"} placeholder="Min. 6 characters" autoComplete="new-password" className={`${inputClass(!!errors.password)} pr-10`} {...register("password")} />
            <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[12px] text-red-500 mt-1.5">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-gray-700 mb-1.5">Confirm password</label>
          <div className="relative">
            <input type={showConfirmPw ? "text" : "password"} placeholder="Repeat your password" autoComplete="new-password" className={`${inputClass(!!errors.confirmPassword)} pr-10`} {...register("confirmPassword")} />
            <button type="button" onClick={() => setShowConfirmPw(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showConfirmPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-[12px] text-red-500 mt-1.5">{errors.confirmPassword.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[38px] mt-2 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? <><Loader2 size={14} className="animate-spin" />Creating account...</> : "Create account"}
        </button>
      </form>

      <p className="text-center text-[13px] text-gray-500 mt-5">
        Already have an account?{" "}
        <Link to="/auth/login" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">Sign in</Link>
      </p>
    </div>
  );
}
