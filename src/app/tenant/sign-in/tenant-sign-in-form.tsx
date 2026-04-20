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
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
              : tone === "error"
                ? "border-rose-300/20 bg-rose-400/10 text-rose-100"
                : "border-white/10 bg-black/20 text-stone-200"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="tenant-email" className="text-sm font-medium text-stone-200">
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
          className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
      >
        {isSubmitting ? "Sending Access Link..." : "Email Me a Sign-In Link"}
      </button>
    </form>
  );
}
