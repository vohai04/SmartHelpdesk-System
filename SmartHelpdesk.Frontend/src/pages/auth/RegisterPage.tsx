import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";

// UI Components
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useToast } from "../../hooks/use-toast";

// Schema for Validation
const registerSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    
    try {
      const data = await authService.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password
      });
      
      // Auto login after successful registration
      const safeToken = data.token || data.Token;
      const safeUserId = data.userId || data.UserId || "";
      const safeEmail = data.email || data.Email || "";
      const safeFullName = data.fullName || data.FullName || "";
      const safeRole = data.role || data.Role || "Customer";
      
      if (safeToken) {
        login(safeToken, { 
          id: safeUserId, 
          email: safeEmail, 
          fullName: safeFullName,
          role: safeRole
        });
        navigate("/");
      } else {
        navigate("/auth/login");
      }
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully.",
      });
    } catch (error: unknown) {
      interface ApiErrorResponse {
        message?: string;
        Message?: string;
        Detailed?: string;
        Errors?: Array<{ PropertyName: string; ErrorMessage: string }>;
      }
      
      const err = error as { response?: { data?: ApiErrorResponse } };
      const errData = err.response?.data;
      
      let errorMsg = "Registration failed. Please try again.";
      if (errData) {
        const validationErrors = errData.Errors?.map((e) => e.ErrorMessage).join(", ");
        errorMsg = validationErrors || errData.message || errData.Message || errData.Detailed || errorMsg;
      }
      
      toast({
        title: "Registration Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Create an Account</h2>
      <p className="text-slate-300 text-sm mb-6">Enter your details to get started.</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-slate-200">Full Name</Label>
          <Input 
            id="fullName" 
            placeholder="John Doe" 
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
            {...register("fullName")}
          />
          {errors.fullName && <p className="text-red-400 text-xs mt-1">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-200">Email Address</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="name@company.com" 
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
            {...register("email")}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-200">Password</Label>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••" 
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
            {...register("password")}
          />
          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
          <Input 
            id="confirmPassword" 
            type="password" 
            placeholder="••••••••" 
            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2.5 rounded-lg shadow-md transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : "Sign Up"}
        </button>
      </form>
      
      <div className="mt-6 text-center text-sm text-slate-400">
        Already have an account? <Link to="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
      </div>
    </div>
  );
}
