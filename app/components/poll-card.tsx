"use client";
import Link from "next/link";
import { PollRow } from "../lib/db-table";

export function PollCard({ poll }: { poll: PollRow }) {
  return (
    <Link href={`/poll/${poll.pda}`}>
      <div className="rounded-lg border border-border bg-card p-6 hover:bg-card/80 hover:border-primary/50 transition">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h2 className="font-semibold text-foreground text-lg">
              {poll.name}
            </h2>
            <p className="text-sm text-muted mt-1">{poll.description}</p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              poll.closed
                ? "bg-destructive/10 text-destructive"
                : "bg-primary/10 text-green-600"
            }`}
          >
            {poll.closed ? "Closed" : "Active"}
          </span>
        </div>

        {poll.results == null ? (
          <div className="text-sm text-muted">Voting not started</div>
        ) : (
          <div className="space-y-2">
            {poll.results.results.map((result, i) => {
              return (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-foreground/70">
                    {result.candidateName}
                  </span>
                  <span className="text-muted font-medium">
                    {result.votes} vote{result.votes !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Link>
  );
}
