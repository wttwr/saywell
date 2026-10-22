import { createFileRoute, redirect } from "@tanstack/react-router";

// Workspace now lives at "/". Keep the old address working with a permanent redirect.
export const Route = createFileRoute("/workspace")({
  beforeLoad: () => {
    throw redirect({ to: "/", code: 301 });
  },
  component: () => null,
});
