"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useApp } from "@/lib/context/AppContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Header";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useApp();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const errs: typeof errors = {};
    if (mode === "signup" && name.trim().length < 3) errs.name = "Name must be at least 3 characters.";
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = "Please enter a valid email.";
    if (password.length < 6) errs.password = "Password must be at least 6 characters.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast({
        variant: "success",
        title: mode === "login" ? "Welcome back!" : "Account created!",
        description:
          mode === "login"
            ? "You are now logged in to CampusPulse."
            : "Your account is ready. Welcome to CampusPulse!",
      });
      router.push("/dashboard");
    }, 900);
  };

  return (
    <section className="mx-auto flex max-w-lg flex-col items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full rounded-2xl bg-white p-8 ring-1 ring-purple-100/60 card-shadow sm:p-10">
        <h1 className="font-display text-center text-2xl font-extrabold tracking-tight text-purple-950">
          {mode === "login" ? "Sign in to CampusPulse" : "Create your account"}
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === "login"
            ? "Enter your email and password to access your dashboard."
            : "Join 2.4 lakh+ students exploring colleges on CampusPulse."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Priya Sharma"
                  className={cn(
                    "h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm transition-colors focus:outline-none",
                    errors.name
                      ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200",
                  )}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya@example.com"
                className={cn(
                  "h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm shadow-sm transition-colors focus:outline-none",
                  errors.email
                    ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200",
                )}
              />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={cn(
                  "h-11 w-full rounded-xl border bg-white pl-10 pr-10 text-sm shadow-sm transition-colors focus:outline-none",
                  errors.password
                    ? "border-red-400 focus:border-red-400 focus:ring-2 focus:ring-red-200"
                    : "border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-uiverse-arrow w-full justify-center py-3 text-base font-bold disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Please wait…
              </span>
            ) : (
              <>
                <span>{mode === "login" ? "Sign in" : "Create account"}</span>
                <div className="arrow-wrapper">
                  <div className="arrow" />
                </div>
              </>
            )}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          {mode === "login" ? (
            <>
              {"Don't have an account? "}
              <button onClick={() => setMode("signup")} className="font-semibold text-blue-600 hover:text-purple-700">
                Create one free
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setMode("login")} className="font-semibold text-blue-600 hover:text-purple-700">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-gray-400">
        By continuing you agree to our{" "}
        <Link href="/about" className="text-blue-600 hover:underline">Terms</Link>
        {" "}and{" "}
        <Link href="/about" className="text-blue-600 hover:underline">Privacy Policy</Link>.
      </p>
    </section>
  );
}