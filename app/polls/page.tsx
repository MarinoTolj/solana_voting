import Link from "next/link";
import fetchPollsFromDb from "../utils/fetch-polls";

export default async function Polls() {
  const polls = await fetchPollsFromDb();

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">All Polls</h1>
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
            <Link key={poll.id} href={`/poll/${poll.pda}`}>
              <div className="rounded-lg border border-border bg-card p-6 hover:bg-card/80 hover:border-primary/50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="font-semibold text-foreground text-lg">
                      {poll.name}
                    </h2>
                    <p className="text-sm text-muted mt-1">
                      {poll.description}
                    </p>
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
                  <div className="text-sm text-muted">Voting in progress</div>
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
          ))}
        </div>
      )}
    </div>
  );
}
