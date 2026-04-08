"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-stone-100 outline-none transition ${
    hasError
      ? "border-rose-400/80 bg-rose-500/8 focus:border-rose-300"
      : "border-white/10 bg-white/5 focus:border-amber-300/60 focus:bg-white/8"
  } placeholder:text-stone-500`;
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
        <div className="rounded-[1.5rem] border border-rose-300/25 bg-rose-400/10 px-5 py-4 text-sm leading-7 text-rose-100">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-200">
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
        {emailError ? <p className="text-sm text-rose-300">{emailError}</p> : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-stone-200">
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
          <p className="text-sm text-rose-300">{passwordError}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-stone-400">
          Staff access is limited to the super and backup accounts created
          through the bootstrap flow.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/staff/bootstrap"
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Bootstrap Setup
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
          >
            {isSubmitting ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </div>
    </form>
  );
}
