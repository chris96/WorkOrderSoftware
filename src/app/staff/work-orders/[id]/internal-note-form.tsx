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
        <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-stone-200">
          {message}
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="internal-note" className="text-sm font-medium text-stone-200">
          Add an internal note
        </label>
        <textarea
          id="internal-note"
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Record private context for staff only. Tenants will never see these notes."
          className="w-full rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-sm leading-7 text-stone-100 outline-none transition placeholder:text-stone-500 focus:border-amber-300/60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-stone-500"
      >
        {isPending ? "Saving Note..." : "Save Internal Note"}
      </button>
    </form>
  );
}
