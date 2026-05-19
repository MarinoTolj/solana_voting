"use client";

import { useEffect, useState } from "react";
import { Address, createSolanaRpc, isAddress } from "@solana/kit";

import {
  fetchCandidate,
  fetchPoll,
  findCandidatePda,
  getCloseCandidateInstructionAsync,
  getClosePollInstructionAsync,
  getStartPollInstructionAsync,
  type Poll,
} from "../generated/voting";
import { CandidateCard } from "./candidate-card";
import { Countdown } from "./countdown";
import { useWallet } from "../lib/wallet/context";
import { useSendTransaction } from "../lib/hooks/use-send-transaction";
import SavePollResults, { PollResult } from "../utils/save-poll";
import ClosePoll from "../utils/close-poll";
import FetchPoll from "../utils/fetch-poll";

const rpc = createSolanaRpc(
  "https://api.devnet.solana.com"
);

type PollStatus =
  | "NOT_STARTED"
  | "ACTIVE"
  | "ENDED";



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
        return <div>Loading...</div>;
    }
    if (poll==null){
        return <div>Poll not found in database</div>
    }

    return (
        <div>
            <p>The poll was closed</p>
            Result:
            {
                poll.results==null
                ?<div>Voting has not yet ended</div>
                :( 
                Array.from({ length: Number(poll.results.results.length) }).map((_, i) => (
                    <p key={i}>{poll.results.results[i].candidateName}, votes:{poll.results.results[i].votes}</p>
                ))
                )

            }
        </div>
    );
}