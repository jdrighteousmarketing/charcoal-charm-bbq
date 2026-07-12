// @ts-nocheck
import { restaurantConfig } from "@/config/restaurantConfig";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  UserRound,
} from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const RESTAURANT_ID = restaurantConfig.id;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (authError || !authData?.user) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("auth_user_id", authData.user.id)
        .maybeSingle();

      if (customerError || !customer) {
        await supabase.auth.signOut();
        setError("Customer profile not found. Please contact support.");
        setLoading(false);
        return;
      }

      window.location.href = "/";
    } catch (err) {
      console.error("Customer login failed:", err);
      setError(err.message || "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={UserRound}
      title="Sign In"
      subtitle="Welcome back! Sign in to your account."
      headingInsideCard
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="font-medium text-orange-400 hover:underline"
          >
            Create Account
          </Link>
        </p>
      }
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-semibold text-white">
            Email
          </Label>

          <div className="relative">
            <Mail
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45"
              aria-hidden="true"
            />

            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 border-orange-500/80 bg-black/20 pl-12 text-base text-white placeholder:text-white/40 focus-visible:ring-orange-500"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-base font-semibold text-white">
            Password
          </Label>

          <div className="relative">
            <Lock
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/45"
              aria-hidden="true"
            />

            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 bg-black/20 pl-12 pr-12 text-base text-white placeholder:text-white/40 focus-visible:ring-orange-500"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 transition-colors hover:text-orange-400"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-orange-400 hover:underline"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          className="h-14 w-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-base font-semibold text-black shadow-lg shadow-orange-500/20 hover:opacity-95"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
