import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function AdminLogin() {
  const [email, setEmail] = useState("admin@pitstop.com");
  const [password, setPassword] = useState("PitStopAdmin2026!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (email !== "admin@pitstop.com" || password !== "PitStopAdmin2026!") {
        setError("Invalid admin email or password");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "pitstop_demo_user",
        JSON.stringify({
          name: "Pit Stop Admin",
          email: "admin@pitstop.com",
          role: "admin",
          loggedIn: true,
        })
      );

      sessionStorage.setItem("adminAccessGranted", "true");

      window.location.href = "/admin";
    } catch (err) {
      setError("Admin login failed");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={ShieldCheck}
      title="Admin Login"
      subtitle="Admin & owner access only"
      footer={
        <>
          Not an admin?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Customer sign up
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
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
              placeholder="admin@pitstop.com"
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
            <span className="text-xs text-muted-foreground">
              demo: PitStopAdmin2026!
            </span>
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="PitStopAdmin2026!"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            "Admin Sign In"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}