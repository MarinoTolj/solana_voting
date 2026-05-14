import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";

export type PollResult={
    totalVotes:number,
    results:CandidateResult[]
}

export type CandidateResult={
    candidateId:number,
    candidateName:string,
    votes:number
}

export default async function SavePollResults(pollResult:PollResult, pollPda:Address<string>){
    const supabase = createClient();

    const { data, error } = await supabase
      .from("polls")
      .update({
        results:pollResult,
      })
      .eq("pda", pollPda);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
}