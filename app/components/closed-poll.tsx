"use client";

import { useEffect, useState } from "react";
import { Address } from "@solana/kit";
import FetchPoll from "../utils/fetch-poll";

export function ClosedPoll({ pda }:{pda:string}) {
    const pollPda=pda as Address<typeof pda>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [poll, setPoll] = useState<any>();
    const [loading, setLoading] = useState(true);
    
    
      useEffect(() => {
        let mounted = true;
    
        async function loadPoll() {
          try {
    
            const pollData = await FetchPoll(pollPda);
    
            if (mounted) {
              setPoll(pollData);
            }
          } catch (err) {
            console.error(err);
          } finally {
            if (mounted) {
              setLoading(false);
            }
          }
        }
    
        loadPoll();
    
        return () => {
          mounted = false;
        };
    }, [pda, pollPda]);

    if (loading) {
        return <div className="mx-auto max-w-2xl px-6 py-8 text-center text-muted">Loading poll results...</div>;
    }
    if (poll==null){
        return <div className="mx-auto max-w-2xl px-6 py-8 text-center text-destructive">Poll not found in database</div>
    }

    return (
        <div className="mx-auto max-w-2xl px-6 py-8">
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Poll Closed</h1>
                    <p className="mt-2 text-foreground/70">Voting has ended. Here are the results:</p>
                </div>

                {poll.results==null ? (
                    <div className="px-4 py-3 rounded-lg bg-accent/50 text-foreground/70">
                        Voting has not yet ended
                    </div>
                ) : (
                    <div className="space-y-3 pt-4">
                        {Array.from({ length: Number(poll.results.results.length) }).map((_, i) => {
                            const result = poll.results.results[i];
                            const percentage = poll.results.totalVotes > 0
                                ? Math.round((result.votes / poll.results.totalVotes) * 100)
                                : 0;

                            return (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-foreground">{result.candidateName}</span>
                                        <span className="text-muted">{result.votes} vote{result.votes !== 1 ? "s" : ""} ({percentage}%)</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted/20 overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="pt-4 border-t border-border text-sm text-muted">
                    Total votes: {poll.results?.totalVotes || 0}
                </div>
            </div>
        </div>
    );
}