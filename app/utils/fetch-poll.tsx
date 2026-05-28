import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";
import { PollRow } from "../lib/db-table";

export default async function FetchPoll(pollPda:Address<string>): Promise<PollRow>{
    const supabase = createClient();

    const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq("pda", pollPda)
    .maybeSingle();

    if (error) {
      console.error(error);
      throw error;
    }
    if (data==null){
      console.log("No poll found for: {}", pollPda)
    }

    return data as PollRow;
}