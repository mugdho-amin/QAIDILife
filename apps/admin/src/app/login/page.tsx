"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLogin } from "@refinedev/core";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { ShieldCheck, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { mutate: loginMutate } = useLogin();

  const handleLogin = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    setError(null);
    loginMutate(
      { email, password },
      {
        onSuccess: () => router.push("/"),
        onError: (err: any) => setError(err?.message ?? "Invalid credentials"),
      },
    );
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden lg:flex lg:w-1/2 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `radial-gradient(circle at 25% 50%, white 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }} />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="h-8 w-1 rounded-full bg-canvas/30" />
              <p className="text-xs uppercase tracking-[0.4em] text-canvas/60">QAIDILIFE</p>
            </div>
            <h1 className="text-4xl font-semibold text-canvas font-display leading-tight">
              Enterprise<br />Operations Console
            </h1>
            <p className="text-canvas/50 text-sm max-w-md leading-relaxed">
              Manage products, orders, payments, and analytics — all from one place.
            </p>
          </div>
          <div className="mt-16 border-t border-canvas/10 pt-8">
            <p className="text-xs text-canvas/40 leading-relaxed max-w-xs">
              Secure admin access for authorized personnel only. All sessions are encrypted and monitored.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink">
              <ShieldCheck className="h-5 w-5 text-canvas" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-text-muted">QAIDILIFE</p>
              <p className="text-sm font-medium text-ink">Admin Access</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold text-ink font-display tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Sign in to manage your commerce operations.
          </p>

          <div className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@qaidilife.com"
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-[calc(50%+6px)] -translate-y-1/2 text-text-muted hover:text-ink transition"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {error && (
              <div className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3 animate-scale-in">
                <p className="text-sm text-danger flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-danger" />
                  {error}
                </p>
              </div>
            )}

            <Button className="w-full" onClick={handleLogin} size="lg">
              Sign In
            </Button>
          </div>

          <p className="mt-8 text-xs text-center text-text-muted">
            QAIDILife Enterprise Console v2.0
          </p>
        </div>
      </div>
    </div>
  );
}
