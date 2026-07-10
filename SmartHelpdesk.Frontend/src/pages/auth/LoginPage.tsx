import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";

// UI Components
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../hooks/use-toast";

// Schema for Validation
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    
    try {
      const data = await authService.login(values);
      
      const safeToken = data.token || data.Token;
      const safeUserId = data.userId || data.UserId || "";
      const safeEmail = data.email || data.Email || "";
      const safeFullName = data.fullName || data.FullName || "";
      const safeRole = data.role || data.Role || "Customer";
      
      if (!safeToken) {
        throw new Error("No token received from server");
      }

      login(safeToken, { 
        id: safeUserId, 
        email: safeEmail, 
        fullName: safeFullName,
        role: safeRole
      });
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${safeFullName}!`,
      });
      
      navigate("/");
    } catch (error: unknown) {
      // Safely access backend error message
      interface ApiErrorResponse {
        message?: string;
        Message?: string;
        Detailed?: string;
        Errors?: Array<{ PropertyName: string; ErrorMessage: string }>;
      }
      
      const err = error as { response?: { data?: ApiErrorResponse } };
      const data = err.response?.data;
      
      let errorMsg = "Please check your credentials and try again.";
      if (data) {
        const validationErrors = data.Errors?.map((e) => e.ErrorMessage).join(", ");
        errorMsg = validationErrors || data.message || data.Message || data.Detailed || errorMsg;
      }
      
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-[20px] font-semibold text-slate-900 mb-1">Sign in</h2>
      <p className="text-slate-500 text-[14px] mb-6">Enter your email and password to continue.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2.5">
          <Label htmlFor="email" className="text-slate-700 text-[13px] font-medium">Email address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@company.com" 
            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900 focus-visible:border-slate-900 h-10 rounded-lg shadow-sm"
            {...register("email")}
          />
          {errors.email && <p className="text-red-500 text-[13px] mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-slate-700 text-[13px] font-medium">Password</Label>
            <a href="#" className="text-[13px] text-slate-500 hover:text-slate-900 transition-colors">Forgot password?</a>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-slate-900 focus-visible:border-slate-900 h-10 rounded-lg shadow-sm"
            {...register("password")}
          />
          {errors.password && <p className="text-red-500 text-[13px] mt-1">{errors.password.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-[14px] h-10 rounded-lg shadow-sm transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Continue"}
        </button>
      </form>
      
      <div className="mt-6 text-center text-[13px] text-slate-500">
        Don't have an account? <Link to="/auth/register" className="text-slate-900 font-medium hover:underline underline-offset-4">Sign up</Link>
      </div>
    </div>
  );
}
