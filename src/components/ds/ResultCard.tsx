import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** Soft result card shared by Dictionary, Interpret and Saved details. */
export function ResultCard({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-secondary/40 p-5 md:p-6", className)}>{children}</div>;
}
