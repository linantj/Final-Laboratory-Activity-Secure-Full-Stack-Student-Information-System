
"use client";

import { useState } from "react";
import Link from "next/link";
import AuthField from "./AuthField";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    alert(
      "Login form is ready. Laravel authentication will be connected next.",
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Student Information System
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthField
          label="Email address"
          name="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
        />

        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          autoComplete="current-password"
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Login
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Don't have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:underline"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
