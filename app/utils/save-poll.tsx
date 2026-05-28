import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";
import { PollResult } from "../lib/db-table";


export default async function UpdatePollResults(pollResult:PollResult, pollPda:Address<string>){
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