"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import {
  activeWorkOrderStatuses,
  formatWorkOrderStatus,
  type WorkOrderStatus,
} from "@/lib/work-orders";

type StaffOption = {
  fullName: string;
  id: string;
  role: string;
};

type WorkOrderControlsProps = {
  assignedUserId: string | null;
  staffOptions: StaffOption[];
  status: WorkOrderStatus;
  workOrderId: string;
};

function getInputClassName() {
  return "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-amber-300/60";
}

export function WorkOrderControls({
  assignedUserId,
  staffOptions,
  status,
  workOrderId,
}: WorkOrderControlsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [selectedAssignee, setSelectedAssignee] = useState(assignedUserId ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const response = await fetch(`/api/staff/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assignedUserId: selectedAssignee || null,
        status: selectedStatus,
      }),
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
        <label htmlFor="status" className="text-sm font-medium text-stone-200">
          Status
        </label>
        <select
          id="status"
          className={getInputClassName()}
          value={selectedStatus}
          onChange={(event) => setSelectedStatus(event.target.value as WorkOrderStatus)}
        >
          {(status === "closed"
            ? (["closed"] as WorkOrderStatus[])
            : [...activeWorkOrderStatuses]
          ).map((statusOption) => (
            <option
              key={statusOption}
              value={statusOption}
              className="bg-white text-stone-950"
            >
              {formatWorkOrderStatus(statusOption)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="assignee"
          className="text-sm font-medium text-stone-200"
        >
          Assigned staff
        </label>
        <select
          id="assignee"
          className={getInputClassName()}
          value={selectedAssignee}
          onChange={(event) => setSelectedAssignee(event.target.value)}
        >
          <option value="" className="bg-white text-stone-950">
            Unassigned
          </option>
          {staffOptions.map((staffOption) => (
            <option
              key={staffOption.id}
              value={staffOption.id}
              className="bg-white text-stone-950"
            >
              {staffOption.fullName} ({staffOption.role})
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-amber-200/60"
      >
        {isPending ? "Saving Changes..." : "Save Status and Assignment"}
      </button>
    </form>
  );
}
