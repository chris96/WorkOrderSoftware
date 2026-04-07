"use client";

import { FormEvent, useState } from "react";

import {
  bootstrapStaffRoles,
  initialStaffBootstrapValues,
  staffBootstrapSchema,
  type StaffBootstrapFieldErrors,
} from "@/lib/validation/staff-bootstrap";

type CreatedStaffUser = {
  email: string;
  fullName: string;
  role: (typeof bootstrapStaffRoles)[number];
};

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-stone-100 outline-none transition ${
    hasError
      ? "border-rose-400/80 bg-rose-500/8 focus:border-rose-300"
      : "border-white/10 bg-white/5 focus:border-amber-300/60 focus:bg-white/8"
  } placeholder:text-stone-500`;
}

export function BootstrapForm() {
  const [values, setValues] = useState(initialStaffBootstrapValues);
  const [errors, setErrors] = useState<StaffBootstrapFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStaffUser, setCreatedStaffUser] =
    useState<CreatedStaffUser | null>(null);

  function updateField<K extends keyof typeof values>(
    field: K,
    value: (typeof values)[K]
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = staffBootstrapSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: StaffBootstrapFieldErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof StaffBootstrapFieldErrors | undefined;

        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      setIsSuccess(false);
      setMessage(null);
      setCreatedStaffUser(null);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    setIsSuccess(false);
    setMessage(null);
    setCreatedStaffUser(null);

    try {
      const response = await fetch("/api/staff/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result.data),
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            message: string;
            staffUser: CreatedStaffUser;
          }
        | {
            ok: false;
            message: string;
          };

      if (!response.ok || !payload.ok) {
        setIsSuccess(false);
        setMessage(payload.message);
        return;
      }

      setIsSuccess(true);
      setMessage(payload.message);
      setCreatedStaffUser(payload.staffUser);
      setValues(initialStaffBootstrapValues);
    } catch (error) {
      setIsSuccess(false);
      setMessage(
        error instanceof Error
          ? error.message
          : "Staff setup failed unexpectedly."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {message ? (
        <div
          className={`rounded-[1.5rem] border px-5 py-4 text-sm leading-7 ${
            isSuccess
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
              : "border-rose-300/25 bg-rose-400/10 text-rose-100"
          }`}
        >
          {message}
        </div>
      ) : null}

      {createdStaffUser ? (
        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-4 text-sm leading-7 text-stone-200">
          <p className="font-medium text-white">{createdStaffUser.fullName}</p>
          <p className="mt-1 text-stone-300">{createdStaffUser.email}</p>
          <p>
            Role: <span className="text-amber-200">{createdStaffUser.role}</span>
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="bootstrap-key" className="text-sm font-medium text-stone-200">
          Bootstrap key
        </label>
        <input
          id="bootstrap-key"
          type="password"
          placeholder="Enter the setup key"
          className={getInputClassName(Boolean(errors.bootstrapKey))}
          value={values.bootstrapKey}
          onChange={(event) => updateField("bootstrapKey", event.target.value)}
        />
        {errors.bootstrapKey ? (
          <p className="text-sm text-rose-300">{errors.bootstrapKey}</p>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="full-name" className="text-sm font-medium text-stone-200">
            Full name
          </label>
          <input
            id="full-name"
            type="text"
            placeholder="Staff member name"
            className={getInputClassName(Boolean(errors.fullName))}
            value={values.fullName}
            onChange={(event) => updateField("fullName", event.target.value)}
          />
          {errors.fullName ? (
            <p className="text-sm text-rose-300">{errors.fullName}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-stone-200">
            Staff role
          </label>
          <select
            id="role"
            className={getInputClassName(Boolean(errors.role))}
            value={values.role}
            onChange={(event) =>
              updateField("role", event.target.value as (typeof bootstrapStaffRoles)[number])
            }
          >
            {bootstrapStaffRoles.map((role) => (
              <option key={role} value={role} className="bg-white text-stone-950">
                {role}
              </option>
            ))}
          </select>
          {errors.role ? (
            <p className="text-sm text-rose-300">{errors.role}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-stone-200">
          Staff email
        </label>
        <input
          id="email"
          type="email"
          placeholder="staff@example.com"
          className={getInputClassName(Boolean(errors.email))}
          value={values.email}
          onChange={(event) => updateField("email", event.target.value)}
        />
        {errors.email ? (
          <p className="text-sm text-rose-300">{errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-stone-200">
          Temporary password
        </label>
        <input
          id="password"
          type="password"
          placeholder="Create a strong temporary password"
          className={getInputClassName(Boolean(errors.password))}
          value={values.password}
          onChange={(event) => updateField("password", event.target.value)}
        />
        <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
          Minimum 10 characters with uppercase, lowercase, and a number
        </p>
        {errors.password ? (
          <p className="text-sm text-rose-300">{errors.password}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-7 text-stone-400">
          Use this only to create the first staff accounts. Once the super and
          backup users exist, rotate the bootstrap key and rely on sign-in.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
        >
          {isSubmitting ? "Creating Staff User..." : "Create Staff User"}
        </button>
      </div>
    </form>
  );
}
