import { useEffect, useState } from "react";
import { Poll } from "../generated/voting";

export type PollStatus = "NOT_STARTED" | "ACTIVE" | "ENDED";

export function usePollTimer(poll: Poll | null) {
  const [status, setStatus] = useState<PollStatus>("NOT_STARTED");
  const [remaining, setRemaining] = useState<number>(0);

  useEffect(() => {
    if (!poll) return;

    async function update() {
      if (!poll) return;

      if (poll.startedAt.__option === "None") {
        setStatus("NOT_STARTED");
        return;
      }

      const now = Date.now();
      const start = Number(poll.startedAt.value) * 1000;
      const end = Number(poll.startedAt.value + poll.duration) * 1000;

      if (now < start) {
        setStatus("NOT_STARTED");
        return;
      }

      if (now >= end) {
        setStatus("ENDED");
        setRemaining(0);
        return;
      }

      setStatus("ACTIVE");
      setRemaining(Math.max(end - now, 0));
    }

    update();
    const interval = setInterval(update, 1000);

    return () => clearInterval(interval);
  }, [poll]);

  return { status, remaining };
}
