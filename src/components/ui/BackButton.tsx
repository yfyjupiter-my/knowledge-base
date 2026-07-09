"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function BackButton({ label = "← Back" }: { label?: string }) {
  const router = useRouter();

  return (
    <Button type="button" variant="ghost" onClick={() => router.back()}>
      {label}
    </Button>
  );
}
