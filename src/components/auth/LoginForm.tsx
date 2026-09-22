"use client";

import { Button } from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

function safeRedirect(value: string | null, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  const validate = useCallback(() => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) errors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email.";
    if (!password) errors.password = "Password is required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [email, password]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        let data: { error?: string; redirect?: string } = {};
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        if (!res.ok) {
          setError(data.error ?? "Invalid email or password. Please try again.");
          return;
        }

        const nextPath = redirectParam
          ? safeRedirect(redirectParam, "/employee")
          : null;
        const welcomePath =
          nextPath && nextPath !== "/welcome"
            ? `/welcome?next=${encodeURIComponent(nextPath)}`
            : "/welcome";
        router.push(welcomePath);
        router.refresh();
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [email, password, redirectParam, router, validate]
  );

  return (
    <div className="login-form-panel" data-login-safe="card">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="login-form"
        noValidate
      >
        <header className="login-form-header">
          <p className="login-form-eyebrow">MJMS Product Development</p>
          <h2 className="login-welcome">Staff login</h2>
          <p className="login-form-subtitle">
            Sign in to access the MJMS product development workspace.
          </p>
        </header>

        <div className="login-fields">
          <div className="login-field-group">
            <label htmlFor="email" className="login-field-label">
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: undefined }));
                setError(null);
              }}
              placeholder="name@mjms.pk"
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.email)}
              className="login-field"
            />
            {fieldErrors.email && (
              <p className="login-field-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="login-field-group">
            <label htmlFor="password" className="login-field-label">
              Password
            </label>
            <div className="login-password-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((p) => ({ ...p, password: undefined }));
                  setError(null);
                }}
                placeholder="Enter your password"
                disabled={loading}
                aria-invalid={Boolean(fieldErrors.password)}
                className="login-field login-field-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="login-password-toggle"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="login-field-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>
        </div>

        <div className="login-options">
          <label className="login-remember">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="login-checkbox"
            />
            Remember me
          </label>
          <button type="button" className="login-forgot" onClick={(e) => e.preventDefault()}>
            Forgot password?
          </button>
        </div>

        {error && (
          <p className="login-form-error" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" loading={loading} className="login-submit">
          Sign In
        </Button>
      </form>
    </div>
  );
}
