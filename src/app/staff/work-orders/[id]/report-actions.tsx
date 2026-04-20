"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReportActionsProps = {
  isClosed: boolean;
  workOrderId: string;
};

export function ReportActions({ isClosed, workOrderId }: ReportActionsProps) {
  const router = useRouter();
  const [isSubmittingAction, setIsSubmittingAction] = useState<
    "regenerate" | "resend" | null
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<"error" | "success" | "info">("info");

  async function runAction(action: "regenerate" | "resend") {
    setIsSubmittingAction(action);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/staff/work-orders/${workOrderId}/report/deliver`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        }
      );

      const payload = (await response.json()) as {
        message: string;
        ok: boolean;
      };

      setMessage(payload.message);
      setTone(response.ok && payload.ok ? "success" : "error");

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      setTone("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "The report action could not be completed. Please try again."
      );
    } finally {
      setIsSubmittingAction(null);
    }
  }

  if (!isClosed) {
    return (
      <p className="mt-4 text-sm leading-7 text-slate-500">
        Report delivery actions unlock after the request has been closed.
      </p>
    );
  }

  return (
    <div className="mt-5 space-y-4">
      {message ? (
        <div
          className={`rounded-[1rem] border px-4 py-3 text-sm leading-7 ${
            tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : tone === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-slate-200 bg-white/80 text-slate-700"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <button
          type="button"
          disabled={isSubmittingAction !== null}
          onClick={() => runAction("resend")}
          className="app-button-secondary justify-center disabled:text-slate-400"
        >
          {isSubmittingAction === "resend"
            ? "Resending Email..."
            : "Resend Completion Email"}
        </button>
        <button
          type="button"
          disabled={isSubmittingAction !== null}
          onClick={() => runAction("regenerate")}
          className="app-button-primary justify-center font-semibold disabled:bg-blue-300"
        >
          {isSubmittingAction === "regenerate"
            ? "Regenerating Report..."
            : "Regenerate Report and Resend Email"}
        </button>
      </div>
    </div>
  );
}
