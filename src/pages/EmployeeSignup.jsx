import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, UserCheck, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function EmployeeSignup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState("register"); // "register" | "otp"
  const [loading, setLoading] = useState(false);
  const role = searchParams.get("role") || "employee";
  const isAdminInvite = role === "owner_admin" || role === "admin";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Register the user
      await base44.auth.register({ email, password });
      setStep("otp");
      toast.success("Verification code sent to your email!");
      setLoading(false);
    } catch (err) {
      console.error("Employee signup error:", err);
      setError(err.message || "Failed to create account. Please try again.");
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!otpCode) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);

    try {
      const response = await base44.auth.verifyOtp({ email, otpCode });
      await base44.auth.setToken(response.access_token);
      
      // Update full name and set correct role
      const updates = {};
      if (name) updates.full_name = name;
      if (Object.keys(updates).length > 0) {
        await base44.auth.updateMe(updates);
      }

      // Set the correct role for employee invites via backend
      if (role === 'employee') {
        await base44.functions.invoke('setEmployeeRole', {});
      }

      setSuccess(true);
      toast.success("Account created successfully!");
      
      if (isAdminInvite) {
        sessionStorage.setItem('adminAccessGranted', 'true');
        setTimeout(() => { window.location.href = "/admin"; }, 1500);
      } else {
        setTimeout(() => { window.location.href = "/employee-login"; }, 1500);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err.message || "Failed to verify code. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        icon={CheckCircle}
        title="Account Created!"
        subtitle={isAdminInvite ? "Your admin account has been set up" : "Your employee account has been set up"}
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-muted-foreground mb-4">
            {isAdminInvite ? "Redirecting to admin dashboard..." : "Redirecting to login..."}
          </p>
          <Button
            onClick={() => { 
              if (isAdminInvite) {
                sessionStorage.setItem('adminAccessGranted', 'true');
                window.location.href = "/admin";
              } else {
                window.location.href = "/employee-login";
              }
            }}
            className="w-full"
          >
            {isAdminInvite ? "Go to Dashboard" : "Go to Login"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (step === "otp") {
    return (
      <AuthLayout
        icon={UserCheck}
        title="Verify Your Email"
        subtitle="Enter the code from your email"
        footer={
          <>
            <div className="flex flex-col gap-2 text-center">
              <span className="text-sm text-muted-foreground">
                Didn't receive a code?{" "}
                <button 
                  type="button"
                  onClick={async () => {
                    try {
                      await base44.auth.resendOtp(email);
                      toast.success("Code resent to your email!");
                    } catch (err) {
                      toast.error("Failed to resend code");
                    }
                  }}
                  className="text-primary font-medium hover:underline bg-none border-none cursor-pointer"
                >
                  Resend Code
                </button>
              </span>
            </div>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleOtpSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">Verification Code</Label>
            <div className="relative">
              <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit code"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="pl-10 h-12 text-center tracking-widest text-lg"
                maxLength="6"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">Check your email for the verification code</p>
          </div>

          <Button type="submit" className="w-full h-12" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & Create Account"
            )}
          </Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserCheck}
      title="Create Employee Account"
      subtitle="Set up your staff access"
      footer={
        <>
          <div className="flex flex-col gap-2 text-center">
            <span className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/employee-login" className="text-primary font-medium hover:underline">
                Employee Login
              </Link>
            </span>
          </div>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 mb-4">
        <AlertCircle className="w-3 h-3 inline mr-1" />
        Only create an account if you received an invitation email from Pit Stop Mobile.
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="pl-10 h-12"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="employee@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
              disabled={!!searchParams.get("email")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <UserCheck className="w-4 h-4 mr-2" />
              Create Employee Account
            </>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}