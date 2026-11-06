"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, apiRequest, errorMessage } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      router.replace("/dashboard");
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.errors) {
        setError(
          Object.values(requestError.errors).flat()[0] ??
            requestError.message,
        );
      } else {
        setError(errorMessage(requestError));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="login-title">
        <div className="brand-mark" aria-hidden="true">S</div>
        <p className="eyebrow">STUDENT INFORMATION SYSTEM</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="muted">Sign in to securely access your student dashboard.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            Email address
            <input
              autoComplete="email"
              className="text-input"
              name="email"
              required
              type="email"
            />
          </label>
          <label className="field">
            Password
            <input
              autoComplete="current-password"
              className="text-input"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
