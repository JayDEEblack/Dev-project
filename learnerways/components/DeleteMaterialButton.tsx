"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMaterialAction } from "@/app/actions";

export default function DeleteMaterialButton({
  materialId,
}: {
  materialId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setLoading(true);
    const result = await deleteMaterialAction(materialId);
    if (result.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-60 ${
        confirming
          ? "bg-red-600 text-white hover:bg-red-500"
          : "text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
      }`}
    >
      {loading
        ? "Deleting…"
        : confirming
          ? "Click to confirm"
          : "Delete"}
    </button>
  );
}