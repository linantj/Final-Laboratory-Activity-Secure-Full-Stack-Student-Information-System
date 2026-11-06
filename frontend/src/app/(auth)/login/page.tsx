"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
type AuthResponse = {
token: string;
};

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");
const [loading, setLoading] = useState(false);
async function handleLogin(
event: React.FormEvent<HTMLFormElement>,
) {
event.preventDefault();
setError("");
setLoading(true);

try {
const result = await apiRequest<AuthResponse>("/login", {
method: "POST",
body: JSON.stringify({ email, password }),
});

// Prototype storage only; do not treat this as a
// production-grade token-storage solution.
sessionStorage.setItem("student_token", result.token);

router.push("/dashboard");
} catch (err) {
setError(
err instanceof Error ? err.message : "Login failed.",
);
} finally {
setLoading(false);
}
}

return (
<main className="mx-auto max-w-md p-8">
<h1 className="mb-6 text-3xl font-bold">Login</h1>
<form onSubmit={handleLogin} className="space-y-4">
<input
className="w-full rounded border p-3"
type="email"
placeholder="Email address"
value={email}
onChange={(event) => setEmail(event.target.value)}
required
/>

<input
className="w-full rounded border p-3"
type="password"
placeholder="Password"
value={password}
onChange={(event) => setPassword(event.target.value)}
required
/>

{error && <p className="text-red-600">{error}</p>}

<button
className="w-full rounded bg-blue-600 p-3 text-white"
disabled={loading}
>
{loading ? "Logging in..." : "Login"}
</button>
</form>

<p className="mt-4">
No account yet? <Link href="/register">Register</Link>
</p>
</main>
);
}