"use client";

import { ChangeEvent, useMemo, useState } from "react";

type CloseoutFormProps = {
  disabled?: boolean;
  isClosed: boolean;
};

type UploadedPhotoPreview = {
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

function getInputClassName(disabled?: boolean) {
  return `w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60 ${
    disabled ? "cursor-not-allowed opacity-60" : ""
  }`;
}

export function CloseoutForm({ disabled = false, isClosed }: CloseoutFormProps) {
  const [repairSummary, setRepairSummary] = useState("");
  const [materialsUsed, setMaterialsUsed] = useState("");
  const [completionNotes, setCompletionNotes] = useState("");
  const [photoPreviews, setPhotoPreviews] = useState<UploadedPhotoPreview[]>([]);

  const repairSummaryLength = useMemo(() => repairSummary.trim().length, [repairSummary]);

  function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    setPhotoPreviews(
      files.map((file) => ({
        id: `${file.name}-${file.lastModified}`,
        name: file.name,
        sizeLabel: formatFileSize(file.size),
      }))
    );
  }

  if (isClosed) {
    return (
      <div className="rounded-[1.5rem] border border-emerald-300/15 bg-emerald-400/10 px-5 py-5 text-sm leading-7 text-emerald-50">
        This request is already closed. In Phase 4, this area will transition into a
        read-only completion view with the final repair summary and closeout photos.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-amber-300/15 bg-amber-300/10 px-5 py-5 text-sm leading-7 text-amber-50">
        This is the Phase 4 closeout form framework. The layout and field structure are
        ready so we can refine the staff completion experience before wiring submission.
      </div>

      <form className="space-y-5" onSubmit={(event) => event.preventDefault()}>
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
            value={repairSummary}
            onChange={(event) => setRepairSummary(event.target.value)}
            placeholder="Describe the repair that was completed and the condition that was resolved."
            disabled={disabled}
            className={getInputClassName(disabled)}
          />
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-stone-500">
            <span>Required for closeout</span>
            <span>{repairSummaryLength} characters</span>
          </div>
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
            value={materialsUsed}
            onChange={(event) => setMaterialsUsed(event.target.value)}
            placeholder="Optional: note any parts, supplies, or materials used for the repair."
            disabled={disabled}
            className={getInputClassName(disabled)}
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
            value={completionNotes}
            onChange={(event) => setCompletionNotes(event.target.value)}
            placeholder="Optional: capture staff-only completion context, follow-up watch items, or anything useful for internal review."
            disabled={disabled}
            className={getInputClassName(disabled)}
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
              disabled ? "cursor-not-allowed opacity-60" : ""
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
            accept="image/*"
            multiple
            disabled={disabled}
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
            Planned closeout behavior
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
            disabled
            className="inline-flex justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-stone-400"
          >
            Save Draft Closeout
          </button>
          <button
            type="submit"
            disabled
            className="inline-flex justify-center rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 opacity-70"
          >
            Complete Repair and Close Request
          </button>
        </div>
      </form>
    </div>
  );
}
