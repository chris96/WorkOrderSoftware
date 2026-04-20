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
          className={`${
            tone === "success"
              ? "app-alert-success"
              : tone === "error"
                ? "app-alert-error"
                : "app-alert-info"
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
          className="app-input"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="app-button-primary w-full justify-center font-semibold"
      >
        {isSubmitting ? "Sending Access Link..." : "Email Me a Sign-In Link"}
      </button>
    </form>
  );
}
