import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";

export default async function handleInsertPoll(pollId:number, pollPda:Address<string>, wallet_address:Address<string>){
    const supabase = createClient();

    const { data, error } = await supabase
      .from("polls")
      .insert({
        poll_id:pollId,
        pda:pollPda,
        created_by:wallet_address
      })
      .select();

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
}