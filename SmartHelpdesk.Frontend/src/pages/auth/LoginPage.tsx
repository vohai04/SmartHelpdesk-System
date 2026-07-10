import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/use-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";

// ─── Schema ───────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const data = await authService.login(values);
      const safeToken    = data.token    || data.Token;
      const safeUserId   = data.userId   || data.UserId   || "";
      const safeEmail    = data.email    || data.Email    || "";
      const safeFullName = data.fullName || data.FullName || "";
      const safeRole     = data.role     || data.Role     || "Customer";

      if (!safeToken) throw new Error("No token received from server");

      login(safeToken, { id: safeUserId, email: safeEmail, fullName: safeFullName, role: safeRole });
      toast({ title: "Welcome back!", description: `Logged in as ${safeFullName}.` });
      navigate("/");
    } catch (error: unknown) {
      interface ApiErrorResponse { message?: string; Message?: string; Detailed?: string; Errors?: Array<{ ErrorMessage: string }>; }
      const err = error as { response?: { data?: ApiErrorResponse } };
      const d = err.response?.data;
      const errorMsg = d?.Errors?.map(e => e.ErrorMessage).join(", ") || d?.message || d?.Message || d?.Detailed || "Invalid email or password.";
      toast({ title: "Sign in failed", description: errorMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold text-gray-900 tracking-tight">Sign in</h1>
        <p className="text-[13px] text-gray-500 mt-1">Welcome back. Enter your credentials to continue.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-[13px] font-medium text-gray-700 mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            className={`w-full h-[38px] px-3 text-[13px] bg-white border rounded-lg outline-none transition-all
              placeholder:text-gray-400 text-gray-900
              ${errors.email ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`}
            {...register("email")}
          />
          {errors.email && <p className="text-[12px] text-red-500 mt-1.5">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-gray-700">Password</label>
            <a href="#" className="text-[12px] text-blue-600 hover:text-blue-700 transition-colors">Forgot password?</a>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className={`w-full h-[38px] px-3 pr-10 text-[13px] bg-white border rounded-lg outline-none transition-all
                placeholder:text-gray-400 text-gray-900
                ${errors.password ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20" : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"}`}
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && <p className="text-[12px] text-red-500 mt-1.5">{errors.password.message}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-[38px] mt-2 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium rounded-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isLoading ? <><Loader2 size={14} className="animate-spin" />Signing in...</> : "Sign in"}
        </button>
      </form>

      <p className="text-center text-[13px] text-gray-500 mt-5">
        Don't have an account?{" "}
        <Link to="/auth/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
          Create account
        </Link>
      </p>
    </div>
  );
}
