"use client";

import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type CloseoutSummaryProps = {
  closedAt: string | null;
  closedByName: string | null;
  completionNotes: string | null;
  isClosed: boolean;
  materialsUsed: string | null;
  repairSummary: string | null;
  workOrderId: string;
};

type UploadedPhotoPreview = {
  file: File;
  id: string;
  name: string;
  sizeLabel: string;
};

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (size >= 1024) {
    return `${Math.round(size / 1024)} KB`;
  }

  return `${size} B`;
}

function getInputClassName(disabled?: boolean, hasError?: boolean) {
  return `w-full rounded-[1.5rem] border bg-white/92 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 ${
    hasError ? "border-rose-300 bg-rose-50" : "border-slate-200"
  } ${disabled ? "cursor-not-allowed opacity-60" : ""}`;
}

export function CloseoutForm({
  closedAt,
  closedByName,
  completionNotes,
  isClosed,
  materialsUsed,
  repairSummary,
  workOrderId,
}: CloseoutSummaryProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success" | "info">("info");
  const [repairSummaryValue, setRepairSummaryValue] = useState(repairSummary ?? "");
  const [materialsUsedValue, setMaterialsUsedValue] = useState(materialsUsed ?? "");
  const [completionNotesValue, setCompletionNotesValue] = useState(
    completionNotes ?? ""
  );
  const [photoPreviews, setPhotoPreviews] = useState<UploadedPhotoPreview[]>([]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const repairSummaryLength = useMemo(
    () => repairSummaryValue.trim().length,
    [repairSummaryValue]
  );

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setPhotoPreviews(
      files.map((file) => ({
        file,
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
      }))
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setFieldError(null);

    if (repairSummaryValue.trim().length < 10) {
      setFieldError("Please enter a repair summary with at least 10 characters.");
      return;
    }

    const formData = new FormData();
    formData.set("repairSummary", repairSummaryValue);
    formData.set("materialsUsed", materialsUsedValue);
    formData.set("completionNotes", completionNotesValue);

    for (const photo of photoPreviews) {
      formData.append("photos", photo.file);
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/staff/work-orders/${workOrderId}/closeout`, {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as
        | {
            ok: true;
            message: string;
            reportDelivery?: {
              deliveryStatus: "failed" | "sent";
              ok: boolean;
            };
          }
        | {
            ok: false;
            message: string;
          };

      setMessage(payload.message);
      setMessageTone(
        response.ok && payload.ok
          ? payload.reportDelivery?.ok === false
            ? "info"
            : "success"
          : "error"
      );

      if (response.ok && payload.ok) {
        setRepairSummaryValue("");
        setMaterialsUsedValue("");
        setCompletionNotesValue("");
        setPhotoPreviews([]);
        setFieldError(null);
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isClosed) {
    return (
      <div className="space-y-4">
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-5 text-sm leading-7 text-emerald-800">
          This request has been closed and is now in its completed state.
        </div>

        <div className="app-panel-subtle px-5 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Closeout summary
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
            <p>
              <span className="font-medium text-slate-900">Repair summary:</span>{" "}
              {repairSummary || "No repair summary recorded."}
            </p>
            <p>
              <span className="font-medium text-slate-900">Materials used:</span>{" "}
              {materialsUsed || "No materials were recorded."}
            </p>
            <p>
              <span className="font-medium text-slate-900">Internal completion notes:</span>{" "}
              {completionNotes || "No internal completion notes were recorded."}
            </p>
            <p>
              <span className="font-medium text-slate-900">Closed by:</span>{" "}
              {closedByName || "Unknown staff user"}
            </p>
            <p>
              <span className="font-medium text-slate-900">Closed at:</span>{" "}
              {closedAt || "Not available"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-blue-200 bg-blue-50 px-5 py-5 text-sm leading-7 text-blue-900">
        Close this request only after the repair is actually complete. This action
        records the final repair summary, marks the request closed, and moves it out
        of the open queue.
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div
            className={`rounded-[1.25rem] border px-4 py-3 text-sm leading-7 ${
              messageTone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : messageTone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white/80 text-slate-700"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="repair-summary"
            className="app-label"
          >
            Repair summary
          </label>
          <textarea
            id="repair-summary"
            rows={5}
            value={repairSummaryValue}
            onChange={(event) => setRepairSummaryValue(event.target.value)}
            placeholder="Describe the repair that was completed and the condition that was resolved."
            disabled={isSubmitting}
            className={getInputClassName(isSubmitting, Boolean(fieldError))}
          />
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-slate-500">
            <span>Required for closeout</span>
            <span>{repairSummaryLength} characters</span>
          </div>
          {fieldError ? <p className="text-sm text-rose-700">{fieldError}</p> : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="materials-used"
            className="app-label"
          >
            Materials used
          </label>
          <textarea
            id="materials-used"
            rows={4}
            value={materialsUsedValue}
            onChange={(event) => setMaterialsUsedValue(event.target.value)}
            placeholder="Optional: note any parts, supplies, or materials used for the repair."
            disabled={isSubmitting}
            className={getInputClassName(isSubmitting)}
          />
          <p className="text-sm leading-7 text-slate-500">
            Optional. This can later feed into the final repair report.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="completion-notes"
            className="app-label"
          >
            Internal completion notes
          </label>
          <textarea
            id="completion-notes"
            rows={4}
            value={completionNotesValue}
            onChange={(event) => setCompletionNotesValue(event.target.value)}
            placeholder="Optional: capture staff-only completion context, follow-up watch items, or anything useful for internal review."
            disabled={isSubmitting}
            className={getInputClassName(isSubmitting)}
          />
          <p className="text-sm leading-7 text-slate-500">
            These notes are intended to stay staff-only.
          </p>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="closeout-photos"
            className="app-label"
          >
            Closeout photos
          </label>
          <label
            htmlFor="closeout-photos"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-white/72 px-6 py-8 text-center transition hover:border-blue-300 hover:bg-blue-50/50 ${
              isSubmitting ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <span className="text-base font-medium text-slate-900">
              Add completion photos
            </span>
            <span className="mt-2 max-w-md text-sm leading-7 text-slate-500">
              Upload optional after-repair photos so staff can document the completed
              work separately from the original intake images.
            </span>
          </label>
          <input
            id="closeout-photos"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={isSubmitting}
            onChange={handlePhotoChange}
            className="sr-only"
          />

          {photoPreviews.length === 0 ? (
            <p className="text-sm leading-7 text-slate-500">
              No closeout photos selected yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {photoPreviews.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-600"
                >
                  <p className="font-medium text-slate-900">{photo.name}</p>
                  <p>{photo.sizeLabel}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="app-panel-subtle px-5 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
            Closeout behavior
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-600">
            <li>Closing this request will set the status to closed.</li>
            <li>A completion timestamp and closing staff user will be recorded.</li>
            <li>Closeout photos will stay separate from intake photos in staff review.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              setRepairSummaryValue("");
              setMaterialsUsedValue("");
              setCompletionNotesValue("");
              setPhotoPreviews([]);
              setFieldError(null);
              setMessage(null);
            }}
            className="app-button-secondary justify-center disabled:text-slate-400"
          >
            Clear Closeout Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="app-button-primary justify-center font-semibold disabled:bg-blue-300"
          >
            {isSubmitting ? "Closing Request..." : "Complete Repair and Close Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

