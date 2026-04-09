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
  return `w-full rounded-[1.5rem] border bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60 ${
    hasError ? "border-rose-300/40" : "border-white/10"
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
          }
        | {
            ok: false;
            message: string;
          };

      setMessage(payload.message);
      setMessageTone(response.ok && payload.ok ? "success" : "error");

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
        <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-400/10 px-5 py-5 text-sm leading-7 text-emerald-50">
          This request has been closed and is now in its completed state.
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
            Closeout summary
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-stone-300">
            <p>
              <span className="font-medium text-white">Repair summary:</span>{" "}
              {repairSummary || "No repair summary recorded."}
            </p>
            <p>
              <span className="font-medium text-white">Materials used:</span>{" "}
              {materialsUsed || "No materials were recorded."}
            </p>
            <p>
              <span className="font-medium text-white">Internal completion notes:</span>{" "}
              {completionNotes || "No internal completion notes were recorded."}
            </p>
            <p>
              <span className="font-medium text-white">Closed by:</span>{" "}
              {closedByName || "Unknown staff user"}
            </p>
            <p>
              <span className="font-medium text-white">Closed at:</span>{" "}
              {closedAt || "Not available"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-amber-300/15 bg-amber-300/10 px-5 py-5 text-sm leading-7 text-amber-50">
        Close this request only after the repair is actually complete. This action
        records the final repair summary, marks the request closed, and moves it out
        of the open queue.
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        {message ? (
          <div
            className={`rounded-[1.25rem] border px-4 py-3 text-sm leading-7 ${
              messageTone === "error"
                ? "border-rose-300/20 bg-rose-400/10 text-rose-50"
                : messageTone === "success"
                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-50"
                  : "border-white/10 bg-black/20 text-stone-200"
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="repair-summary"
            className="text-sm font-medium text-stone-200"
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
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-stone-500">
            <span>Required for closeout</span>
            <span>{repairSummaryLength} characters</span>
          </div>
          {fieldError ? <p className="text-sm text-rose-200">{fieldError}</p> : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="materials-used"
            className="text-sm font-medium text-stone-200"
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
          <p className="text-sm leading-7 text-stone-500">
            Optional. This can later feed into the final repair report.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="completion-notes"
            className="text-sm font-medium text-stone-200"
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
          <p className="text-sm leading-7 text-stone-500">
            These notes are intended to stay staff-only.
          </p>
        </div>

        <div className="space-y-3">
          <label
            htmlFor="closeout-photos"
            className="text-sm font-medium text-stone-200"
          >
            Closeout photos
          </label>
          <label
            htmlFor="closeout-photos"
            className={`flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/15 bg-black/20 px-6 py-8 text-center transition hover:border-white/25 hover:bg-black/30 ${
              isSubmitting ? "cursor-not-allowed opacity-60" : ""
            }`}
          >
            <span className="text-base font-medium text-white">
              Add completion photos
            </span>
            <span className="mt-2 max-w-md text-sm leading-7 text-stone-400">
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
            <p className="text-sm leading-7 text-stone-500">
              No closeout photos selected yet.
            </p>
          ) : (
            <div className="grid gap-3">
              {photoPreviews.map((photo) => (
                <div
                  key={photo.id}
                  className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-stone-300"
                >
                  <p className="font-medium text-white">{photo.name}</p>
                  <p>{photo.sizeLabel}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 px-5 py-5">
          <p className="text-sm uppercase tracking-[0.2em] text-stone-500">
            Closeout behavior
          </p>
          <ul className="mt-4 space-y-2 text-sm leading-7 text-stone-300">
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
            className="inline-flex justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-stone-500"
          >
            Clear Closeout Form
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
          >
            {isSubmitting ? "Closing Request..." : "Complete Repair and Close Request"}
          </button>
        </div>
      </form>
    </div>
  );
}
