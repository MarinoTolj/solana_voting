import Link from "next/link";
import { PollCard } from "../components/poll-card";
import { PollRow } from "../lib/db-table";

export type PollListProps = {
  polls: PollRow[];
  scope: "all" | "user";
};
export default function PollList(props: PollListProps) {
  const { polls, scope } = props;
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">
          {scope === "all" ? "All" : "Your"} Polls
        </h1>
        <p className="mt-2 text-foreground/70">
          Browse and participate in active and closed polls
        </p>
      </div>

      {!polls || polls.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-muted">
          <p className="mb-4">No polls found yet.</p>
          <Link
            href="/poll/create"
            className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition"
          >
            Create the first poll
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {polls.map((poll) => (
            <PollCard key={poll.pda} poll={poll} />
          ))}
        </div>
      )}
    </div>
  );
}
