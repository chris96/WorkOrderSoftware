"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-400"
      : "border-slate-200 bg-white/92 focus:border-blue-500"
  } placeholder:text-slate-400`;
}

type SignInFormProps = {
  initialMessage?: string;
};

export function SignInForm({ initialMessage }: SignInFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(initialMessage ?? null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    let nextEmailError: string | null = null;
    let nextPasswordError: string | null = null;

    if (!email.trim()) {
      nextEmailError = "Please enter your staff email address.";
    }

    if (!password) {
      nextPasswordError = "Please enter your password.";
    }

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/staff");
    router.refresh();
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {message ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-800">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="app-label">
          Staff email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="staff@example.com"
          className={getInputClassName(Boolean(emailError))}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (emailError) {
              setEmailError(null);
            }
          }}
        />
        {emailError ? <p className="text-sm text-rose-700">{emailError}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="app-label">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          className={getInputClassName(Boolean(passwordError))}
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            if (passwordError) {
              setPasswordError(null);
            }
          }}
        />
        {passwordError ? (
          <p className="text-sm text-rose-700">{passwordError}</p>
        ) : null}
      </div>

      <div className="app-divider flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-slate-500">
          Staff access is limited to the super and backup accounts created
          through the bootstrap flow.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/staff/bootstrap"
            className="app-button-secondary items-center justify-center"
          >
            Bootstrap Setup
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="app-button-primary px-6 font-semibold disabled:bg-blue-300"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </form>
  );
}
