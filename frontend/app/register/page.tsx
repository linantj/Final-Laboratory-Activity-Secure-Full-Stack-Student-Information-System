"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, apiRequest, errorMessage } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);

    try {
      await apiRequest("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          password: form.get("password"),
          password_confirmation: form.get("password_confirmation"),
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
      <section className="auth-card" aria-labelledby="register-title">
        <div className="brand-mark" aria-hidden="true">S</div>
        <p className="eyebrow">STUDENT INFORMATION SYSTEM</p>
        <h1 id="register-title">Create your account</h1>
        <p className="muted">Register to access the student records dashboard.</p>

        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            Full name
            <input
              autoComplete="name"
              className="text-input"
              maxLength={255}
              name="name"
              required
              type="text"
            />
          </label>
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
              autoComplete="new-password"
              className="text-input"
              minLength={8}
              name="password"
              required
              type="password"
            />
          </label>
          <label className="field">
            Confirm password
            <input
              autoComplete="new-password"
              className="text-input"
              minLength={8}
              name="password_confirmation"
              required
              type="password"
            />
          </label>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={loading} type="submit">
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
