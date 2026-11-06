"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ApiError,
  apiRequest,
  errorMessage,
} from "@/lib/api";
import type { AuthUser, StudentResponse } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [source, setSource] = useState<"cloud" | "physical">("cloud");
  const [records, setRecords] = useState<StudentResponse | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState("");

  const loadRecords = useCallback(async (selectedSource: "cloud" | "physical") => {
    setLoadingRecords(true);
    setRecords(null);
    setError("");

    try {
      const result = await apiRequest<StudentResponse>(
        `/api/students?source=${selectedSource}`,
      );
      setRecords(result);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        router.replace("/login");
        return;
      }
      setRecords(null);
      setError(errorMessage(requestError));
    } finally {
      setLoadingRecords(false);
    }
  }, [router]);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const result = await apiRequest<{ user: AuthUser }>("/api/auth/user");
        if (!active) return;
        setUser(result.user);
        setLoadingUser(false);
        await loadRecords("cloud");
      } catch (requestError) {
        if (!active) return;
        if (requestError instanceof ApiError && requestError.status === 401) {
          router.replace("/login");
        } else {
          setError(errorMessage(requestError));
        }
      } finally {
        if (active) setLoadingUser(false);
      }
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [loadRecords, router]);

  async function handleLogout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
    } catch (logoutError) {
      setError(errorMessage(logoutError));
    } finally {
      router.replace("/login");
    }
  }

  function handleSourceChange(value: string) {
    if (value !== "cloud" && value !== "physical") return;
    setSource(value);
    void loadRecords(value);
  }

  const columns = records?.students[0]
    ? Object.keys(records.students[0])
    : [];

  if (loadingUser) {
    return (
      <main className="dashboard-layout">
        <p className="muted" role="status">Loading your account...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="dashboard-layout">
        <p className="error-message" role="alert">
          {error || "Your account could not be loaded."}
        </p>
        <p className="muted"><Link href="/login">Return to sign in</Link></p>
      </main>
    );
  }

  return (
    <main className="dashboard-layout">
      <header className="topbar">
        <Link className="wordmark" href="/dashboard">
          <span className="brand-mark small" aria-hidden="true">S</span>
          Scholar<span>Desk</span>
        </Link>
        <button className="text-button" onClick={handleLogout} type="button">
          Sign out
        </button>
      </header>

      <section className="welcome-panel" aria-labelledby="welcome-title">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1 id="welcome-title">Welcome, {user?.name}</h1>
          <p className="muted">{user?.email}</p>
        </div>
        <div className="profile-avatar" aria-hidden="true">
          {user?.name.slice(0, 1).toUpperCase()}
        </div>
      </section>

      <section className="records-section" aria-labelledby="records-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ACADEMIC DATA</p>
            <h2 id="records-title">Student records</h2>
            <p className="muted">Browse records from your selected database.</p>
          </div>
          <div className="record-actions">
            <label className="field compact-field">
              Database source
              <select
                className="text-input"
                disabled={loadingRecords}
                onChange={(event) => handleSourceChange(event.target.value)}
                value={source}
              >
                <option value="cloud">Supabase cloud</option>
                <option value="physical">Physical MySQL</option>
              </select>
            </label>
            <button
              className="secondary-button"
              disabled={loadingRecords}
              onClick={() => void loadRecords(source)}
              type="button"
            >
              {loadingRecords ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="count-card" aria-live="polite">
          <span className="count-number">{records?.count ?? "—"}</span>
          <span className="muted">records from {source === "cloud" ? "Supabase" : "physical MySQL"}</span>
        </div>

        {error && <p className="error-message dashboard-error" role="alert">{error}</p>}

        <div className="table-card">
          {loadingRecords ? (
            <p className="table-message" role="status">Loading student records...</p>
          ) : !records?.students.length ? (
            <p className="table-message">
              {error ? "Records could not be loaded." : "No student records found in this database."}
            </p>
          ) : (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  {records.count} student records from the {records.source} database
                </caption>
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column} scope="col">{column.replaceAll("_", " ")}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.students.map((student, index) => (
                    <tr key={String(student.id ?? index)}>
                      {columns.map((column) => (
                        <td key={column}>{formatCell(student[column])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
      <footer className="page-footer">
        Student data is read directly from the selected database.
      </footer>
    </main>
  );
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
