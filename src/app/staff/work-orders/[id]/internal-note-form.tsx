"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

type InternalNoteFormProps = {
  workOrderId: string;
};

export function InternalNoteForm({ workOrderId }: InternalNoteFormProps) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch(`/api/staff/work-orders/${workOrderId}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note }),
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

    if (response.ok && payload.ok) {
      setNote("");
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {message ? (
        <div className="rounded-[1.25rem] border border-slate-200 bg-white/80 px-4 py-3 text-sm leading-7 text-slate-700">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="internal-note" className="app-label">
          Add an internal note
        </label>
        <textarea
          id="internal-note"
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Record private context for staff only. Tenants will never see these notes."
          className="w-full rounded-[1.5rem] border border-slate-200 bg-white/92 px-4 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="app-button-secondary w-full justify-center disabled:text-slate-400"
      >
        {isPending ? "Saving Note..." : "Save Internal Note"}
      </button>
    </form>
  );
}
