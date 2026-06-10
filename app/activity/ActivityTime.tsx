"use client";

import { useEffect, useState } from "react";

// Render the timestamp in the viewer's local time (server renders in UTC).
export default function ActivityTime({ iso }: { iso: string }) {
  const [text, setText] = useState("");
  useEffect(() => {
    setText(
      new Date(iso).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    );
  }, [iso]);
  return <span suppressHydrationWarning>{text}</span>;
}
