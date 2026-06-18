import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, UserCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.loginViaEmailPassword(email, password);
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      const user = await base44.auth.me();
      if (user?.role !== 'employee') {
        await base44.auth.logout();
        setError("Access denied. This login is for employees only.");
        setLoading(false);
        return;
      }

      sessionStorage.removeItem('adminAccessGranted');
      window.location.replace("/admin");
    } catch (err) {
      setError("Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserCheck}
      title="Employee Login"
      subtitle="Staff access only"
      footer={
        <>
          <div className="flex flex-col gap-2 text-center">
            <span className="text-sm text-muted-foreground">
              First time?{" "}
              <button 
                type="button"
                onClick={() => { window.location.href = "/employee-signup"; }}
                className="text-primary font-medium hover:underline bg-none border-none cursor-pointer"
              >
                Create Employee Account
              </button>
            </span>
            <span className="text-sm text-muted-foreground">
              Not an employee?{" "}
              <Link to="/register" className="text-primary font-medium hover:underline">
                Customer sign up
              </Link>
            </span>
          </div>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
              autoFocus
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</> : "Employee Sign In"}
        </Button>
      </form>
    </AuthLayout>
  );
}