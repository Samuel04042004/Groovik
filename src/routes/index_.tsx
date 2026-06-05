import { createFileRoute, redirect } from "@tanstack/react-router";

// Lovable Preview sometimes navigates to "/index" — alias it to "/".
export const Route = createFileRoute("/index_")({
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});
