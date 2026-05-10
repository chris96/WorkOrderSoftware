"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useState } from "react";

import {
  initialWorkOrderRequestValues,
  workOrderCategories,
  workOrderRequestSchema,
  type WorkOrderFieldErrors,
} from "@/lib/validation/work-order-request";

type UploadedPhoto = {
  contentType: string;
  fileName: string;
  path: string;
  size: number;
};

type SubmittedWorkOrder = {
  id: string;
  status: string;
  unitNumber: string;
};

type IntakeSubmissionSuccessResponse = {
  ok: true;
  duplicate: boolean;
  message: string;
  uploadedPhotos: UploadedPhoto[];
  workOrder: SubmittedWorkOrder;
};

type IntakeSubmissionErrorResponse = {
  ok: false;
  message: string;
};

type SubmitRequestFormProps = {
  unitOptions: string[];
};

function getInputClassName(hasError: boolean) {
  return `w-full rounded-2xl border px-4 py-3 text-sm text-slate-900 outline-none transition ${
    hasError
      ? "border-rose-300 bg-rose-50 focus:border-rose-400"
      : "border-slate-200 bg-white/92 focus:border-blue-500"
  } placeholder:text-slate-400`;
}

export function SubmitRequestForm({
  unitOptions,
}: SubmitRequestFormProps) {
  const router = useRouter();
  const [values, setValues] = useState(initialWorkOrderRequestValues);
  const [errors, setErrors] = useState<WorkOrderFieldErrors>({});
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  function resetFormState() {
    setValues(initialWorkOrderRequestValues);
    setErrors({});
    setUploadMessage(null);
  }

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

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    updateField("photos", files);
    setUploadMessage(null);
  }

  async function handleReviewRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

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
      setUploadMessage(null);
      return;
    }

    setErrors({});
    setUploadMessage(null);
    setIsUploadingPhotos(true);

    try {
      const formData = new FormData();
      formData.append("unit", values.unit);
      formData.append("category", values.category);
      formData.append("tenantName", values.tenantName);
      formData.append("email", values.email);
      formData.append("phone", values.phone ?? "");
      formData.append("description", values.description);
      formData.append("isEmergency", String(values.isEmergency));

      for (const photo of values.photos) {
        formData.append("photos", photo);
      }

      const response = await fetch("/api/work-orders/intake", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | IntakeSubmissionSuccessResponse
        | IntakeSubmissionErrorResponse;

      if (!response.ok || !payload.ok) {
        setUploadMessage(
          payload.ok ? "Photo upload failed." : payload.message
        );
        return;
      }

      form.reset();
      resetFormState();

      const successParams = new URLSearchParams({
        duplicate: String(payload.duplicate),
        message: payload.message,
        requestId: payload.workOrder.id,
        status: payload.workOrder.status,
        unit: payload.workOrder.unitNumber,
        photoCount: String(payload.uploadedPhotos.length),
      });

      router.replace(`/submit-request/success?${successParams.toString()}`);
    } catch (error) {
      setUploadMessage(
        error instanceof Error
          ? error.message
          : "Request submission failed unexpectedly."
      );
    } finally {
      setIsUploadingPhotos(false);
    }
  }

  return (
    <main className="px-6 py-12 md:px-8 md:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-8 xl:grid-cols-[0.8fr_1.2fr]">
        <section className="app-aside">
          <p className="app-kicker">Tenant Request</p>
          <h1 className="app-heading">
            Tell us what needs repair.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 md:text-lg">
            This is the first version of the maintenance request form. It is
            designed to feel clear and calm for tenants while collecting the
            information the building staff will need later.
          </p>

          <div className="mt-10 space-y-4">
            <div className="app-note-info">
              <h2 className="text-sm uppercase tracking-[0.24em] text-slate-500">
                What this form will capture
              </h2>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
                <li>Unit and contact details for follow-up</li>
                <li>Maintenance category and repair description</li>
                <li>Emergency flag for urgent situations</li>
                <li>Optional photo attachments for faster diagnosis</li>
              </ul>
            </div>

            <div className="app-note-accent">
              <p className="text-sm font-medium text-blue-800">
                Current scope
              </p>
              <p className="mt-2 text-sm leading-7 text-blue-900/80">
                This form now validates, creates a work order record, uploads
                intake photos, and records the submission event. A dedicated
                confirmation flow will come next.
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="app-button-secondary mt-8"
          >
            Back Home
          </Link>
        </section>

        <section className="app-form-panel">
          <form className="space-y-8" onSubmit={handleReviewRequest} noValidate>
            {uploadMessage ? (
              <div
                className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm leading-7 text-rose-800"
              >
                {uploadMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="unit"
                  className="app-label"
                >
                  Unit
                </label>
                <select
                  id="unit"
                  className={getInputClassName(Boolean(errors.unit))}
                  value={values.unit}
                  onChange={(event) => updateField("unit", event.target.value)}
                >
                  <option value="" disabled className="bg-white text-slate-900">
                    {unitOptions.length > 0
                      ? "Select your unit"
                      : "No units available yet"}
                  </option>
                  {unitOptions.map((unit) => (
                    <option
                      key={unit}
                      value={unit}
                      className="bg-white text-slate-900"
                    >
                      {unit}
                    </option>
                  ))}
                </select>
                {errors.unit ? (
                  <p className="text-sm text-rose-700">{errors.unit}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="category"
                  className="app-label"
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
                  <option value="" disabled className="bg-white text-slate-900">
                    Choose a category
                  </option>
                  {workOrderCategories.map((category) => (
                    <option
                      key={category}
                      value={category}
                      className="bg-white text-slate-900"
                    >
                      {category}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="text-sm text-rose-700">{errors.category}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="tenant-name"
                  className="app-label"
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
                  <p className="text-sm text-rose-700">{errors.tenantName}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="app-label"
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
                  <p className="text-sm text-rose-700">{errors.email}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label
                  htmlFor="phone"
                  className="app-label"
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
                  <p className="text-sm text-rose-700">{errors.phone}</p>
                ) : null}
              </div>

              <label className="flex items-end gap-3 rounded-[1.5rem] border border-blue-200 bg-blue-50/90 px-5 py-4 md:min-w-[220px]">
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border border-slate-300 bg-white accent-blue-600"
                  checked={values.isEmergency}
                  onChange={(event) =>
                    updateField("isEmergency", event.target.checked)
                  }
                />
                <span className="text-sm leading-6 text-blue-900">
                  Mark this as an emergency if the issue is urgent.
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="app-label"
              >
                Describe the issue
              </label>
              <textarea
                id="description"
                rows={6}
                placeholder="Tell us what is happening, where it is happening, and anything staff should know before arriving."
                className={`w-full rounded-[1.75rem] border px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition ${
                  errors.description
                    ? "border-rose-300 bg-rose-50 focus:border-rose-400"
                    : "border-slate-200 bg-white/92 focus:border-blue-500"
                } placeholder:text-slate-400`}
                value={values.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
              />
              {errors.description ? (
                <p className="text-sm text-rose-700">{errors.description}</p>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="app-label">
                  Photos
                </label>
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  Optional
                </p>
              </div>

              <label
                htmlFor="photos"
                className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed px-6 py-8 text-center transition ${
                  errors.photos
                    ? "border-rose-300 bg-rose-50"
                    : "border-slate-300 bg-white/72 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs uppercase tracking-[0.25em] text-slate-600">
                  Add photos
                </div>
                <p className="mt-5 text-base font-medium text-slate-900">
                  Drag images here or browse your device
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                  Supported preview types for this layout: JPG, PNG, and WEBP.
                  Files upload to Supabase when the request is submitted.
                </p>
                {values.photos.length > 0 ? (
                  <p className="mt-4 text-sm text-slate-700">
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
                <p className="text-sm text-rose-700">{errors.photos}</p>
              ) : null}

            </div>

            <div className="app-divider flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-7 text-slate-500">
                Successful submissions now redirect to a confirmation page so
                the form is not left in a ready-to-resubmit state.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="app-button-secondary"
                  onClick={resetFormState}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={isUploadingPhotos || unitOptions.length === 0}
                  className="app-button-primary px-6 font-semibold disabled:bg-blue-300"
                >
                  {isUploadingPhotos ? "Submitting Request..." : "Submit Request"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
