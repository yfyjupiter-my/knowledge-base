"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { setFavorite } from "@/lib/actions";

export function StarToggle({
  docId,
  initialFavorited = false,
}: {
  docId: string;
  initialFavorited?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [, startTransition] = useTransition();

  const toggle = () => {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      try {
        await setFavorite(docId, next);
      } catch {
        setFavorited(!next);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={favorited}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      className="cursor-pointer text-text-muted transition-colors hover:text-warning"
    >
      <Star className="h-4 w-4" fill={favorited ? "currentColor" : "none"} color={favorited ? "var(--warning)" : "currentColor"} />
    </button>
  );
}
