"use client";

import { FormEvent, useState } from "react";

export function TenantSignInForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success" | "info">("info");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/tenant/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      });

      const payload = (await response.json()) as {
        message: string;
        ok: boolean;
      };

      setMessage(payload.message);
      setTone(response.ok && payload.ok ? "success" : "error");

      if (response.ok && payload.ok) {
        setEmail("");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      {message ? (
        <div
          className={`rounded-[1.25rem] border px-4 py-3 text-sm leading-7 ${
            tone === "success"
              ? "border-sky-200 bg-sky-50 text-sky-900"
              : tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-900"
                : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="tenant-email" className="text-sm font-medium text-slate-700">
          Tenant email
        </label>
        <input
          id="tenant-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@example.com"
          disabled={isSubmitting}
          className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full justify-center rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:bg-sky-300"
      >
        {isSubmitting ? "Sending Access Link..." : "Email Me a Sign-In Link"}
      </button>
    </form>
  );
}
