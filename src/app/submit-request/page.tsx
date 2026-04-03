"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useState } from "react";

import {
  initialWorkOrderRequestValues,
  workOrderCategories,
  workOrderRequestSchema,
  type WorkOrderFieldErrors,
} from "@/lib/validation/work-order-request";

const unitOptions = ["1A", "2B", "3C", "4D"];

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-stone-100 outline-none transition ${
    hasError
      ? "border-rose-400/80 bg-rose-500/8 focus:border-rose-300"
      : "border-white/10 bg-white/5 focus:border-amber-300/60 focus:bg-white/8"
  } placeholder:text-stone-500`;
}

export default function SubmitRequestPage() {
  const [values, setValues] = useState(initialWorkOrderRequestValues);
  const [errors, setErrors] = useState<WorkOrderFieldErrors>({});
  const [isValidated, setIsValidated] = useState(false);

  function updateField<K extends keyof typeof values>(field: K, value: (typeof values)[K]) {
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

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    updateField("photos", files);
  }

  function handleReviewRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = workOrderRequestSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors: WorkOrderFieldErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof WorkOrderFieldErrors | undefined;

        if (field && !fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }

      setErrors(fieldErrors);
      setIsValidated(false);
      return;
    }

    setErrors({});
    setIsValidated(true);
  }

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl shadow-black/30 backdrop-blur md:p-10">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-300">
            Tenant Request
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Tell us what needs repair.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-stone-300 md:text-lg">
            This is the first version of the maintenance request form. It is
            designed to feel clear and calm for tenants while collecting the
            information the building staff will need later.
          </p>

          <div className="mt-10 space-y-4">
            <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
              <h2 className="text-sm uppercase tracking-[0.24em] text-stone-400">
                What this form will capture
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
                <li>Unit and contact details for follow-up</li>
                <li>Maintenance category and repair description</li>
                <li>Emergency flag for urgent situations</li>
                <li>Optional photo attachments for faster diagnosis</li>
              </ul>
            </div>

            <div className="rounded-[1.5rem] border border-amber-300/20 bg-amber-300/8 p-5">
              <p className="text-sm font-medium text-amber-100">
                Current scope
              </p>
              <p className="mt-2 text-sm leading-7 text-amber-50/90">
                The form below is a design-ready framework only. Submission,
                validation, uploads, and database writes come next.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="mt-8 inline-flex rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Back Home
          </Link>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 shadow-2xl shadow-black/40 backdrop-blur md:p-8">
          <form className="space-y-8" onSubmit={handleReviewRequest} noValidate>
            {isValidated ? (
              <div className="rounded-[1.5rem] border border-emerald-300/25 bg-emerald-400/10 px-5 py-4 text-sm leading-7 text-emerald-100">
                The form layout is validated and ready for the next step. The
                data is not being submitted yet, but all current fields pass the
                client-side checks.
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="unit"
                  className="text-sm font-medium text-stone-200"
                >
                  Unit
                </label>
                <select
                  id="unit"
                  className={getInputClassName(Boolean(errors.unit))}
                  value={values.unit}
                  onChange={(event) => updateField("unit", event.target.value)}
                >
                  <option value="" disabled>
                    Select your unit
                  </option>
                  {unitOptions.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
                {errors.unit ? (
                  <p className="text-sm text-rose-300">{errors.unit}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="text-sm font-medium text-stone-200"
                >
                  Maintenance category
                </label>
                <select
                  id="category"
                  className={getInputClassName(Boolean(errors.category))}
                  value={values.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                >
                  <option value="" disabled>
                    Choose a category
                  </option>
                  {workOrderCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="text-sm text-rose-300">{errors.category}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="tenant-name"
                  className="text-sm font-medium text-stone-200"
                >
                  Full name
                </label>
                <input
                  id="tenant-name"
                  type="text"
                  placeholder="Your full name"
                  className={getInputClassName(Boolean(errors.tenantName))}
                  value={values.tenantName}
                  onChange={(event) =>
                    updateField("tenantName", event.target.value)
                  }
                />
                {errors.tenantName ? (
                  <p className="text-sm text-rose-300">{errors.tenantName}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-stone-200"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className={getInputClassName(Boolean(errors.email))}
                  value={values.email}
                  onChange={(event) => updateField("email", event.target.value)}
                />
                {errors.email ? (
                  <p className="text-sm text-rose-300">{errors.email}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-stone-200"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Best number to reach you"
                  className={getInputClassName(Boolean(errors.phone))}
                  value={values.phone}
                  onChange={(event) => updateField("phone", event.target.value)}
                />
                {errors.phone ? (
                  <p className="text-sm text-rose-300">{errors.phone}</p>
                ) : null}
              </div>

              <label className="flex items-end gap-3 rounded-[1.5rem] border border-amber-300/20 bg-amber-300/8 px-5 py-4 md:min-w-[220px]">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border border-white/15 bg-white/5 accent-amber-300"
                  checked={values.isEmergency}
                  onChange={(event) =>
                    updateField("isEmergency", event.target.checked)
                  }
                />
                <span className="text-sm leading-6 text-amber-50">
                  Mark this as an emergency if the issue is urgent.
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="text-sm font-medium text-stone-200"
              >
                Describe the issue
              </label>
              <textarea
                id="description"
                rows={6}
                placeholder="Tell us what is happening, where it is happening, and anything staff should know before arriving."
                className={`w-full rounded-[1.75rem] border px-4 py-4 text-sm leading-7 text-stone-100 outline-none transition ${
                  errors.description
                    ? "border-rose-400/80 bg-rose-500/8 focus:border-rose-300"
                    : "border-white/10 bg-white/5 focus:border-amber-300/60 focus:bg-white/8"
                } placeholder:text-stone-500`}
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
              {errors.description ? (
                <p className="text-sm text-rose-300">{errors.description}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="text-sm font-medium text-stone-200">
                  Photos
                </label>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                  Optional
                </p>
              </div>

              <label
                htmlFor="photos"
                className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 py-8 text-center transition ${
                  errors.photos
                    ? "border-rose-400/70 bg-rose-500/8"
                    : "border-white/15 bg-white/[0.03] hover:border-amber-300/40 hover:bg-white/[0.05]"
                }`}
              >
                <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-stone-300">
                  Add photos
                </div>
                <p className="mt-5 text-base font-medium text-white">
                  Drag images here or browse your device
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-stone-400">
                  Supported preview types for this layout: JPG, PNG, and WEBP.
                  Upload behavior will be connected in the next step.
                </p>
                {values.photos.length > 0 ? (
                  <p className="mt-4 text-sm text-stone-200">
                    {values.photos.length} file
                    {values.photos.length === 1 ? "" : "s"} selected
                  </p>
                ) : null}
                <input
                  id="photos"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handlePhotoChange}
                />
              </label>
              {errors.photos ? (
                <p className="text-sm text-rose-300">{errors.photos}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-stone-400">
                You will review the final interaction and styling first. No
                data is submitted from this screen yet.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5"
                  onClick={() => {
                    setValues(initialWorkOrderRequestValues);
                    setErrors({});
                    setIsValidated(false);
                  }}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200"
                >
                  Review Request
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
