import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

const RESTAURANT_ID = "pit_stop_mobile";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) {
        throw authError;
      }

      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", RESTAURANT_ID)
        .eq("email", cleanEmail)
        .single();

      if (customerError || !customer) {
        await supabase.auth.signOut();
        setError("Customer profile not found. Please contact support.");
        return;
      }

      localStorage.setItem(
        "pitstop_demo_user",
        JSON.stringify({
          id: customer.id,
          name: customer.name || cleanEmail.split("@")[0],
          email: customer.email || cleanEmail,
          phone: customer.phone || "",
          birthday: customer.birthday || "",
          address: customer.address || "",
          role: "user",
          loggedIn: true,
          restaurant_id: RESTAURANT_ID,
          customer_id_code: customer.customer_code,
          customer_code: customer.customer_code,
          points_balance: Number(customer.points_balance || 0),
          total_points_earned: Number(customer.lifetime_points || 0),
          lifetime_points: Number(customer.lifetime_points || 0),
        })
      );

      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome Back"
      subtitle="Log in to your rewards account"
      footer={
        <div className="flex flex-col gap-2 text-center">
          <span className="text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              type="button"
              onClick={() => {
                window.location.href = "/register";
              }}
              className="text-primary font-medium hover:underline bg-none border-none cursor-pointer"
            >
              Sign up
            </button>
          </span>
        </div>
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
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
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
              className="pl-10 h-12"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>

            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              aria-hidden="true"
            />

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

        <Button
          type="submit"
          className="w-full h-12 font-medium"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Member Log In"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}