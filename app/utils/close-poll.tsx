import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";

export default async function ClosePoll(pollPda:Address<string>){
    const supabase = createClient();

    const { data, error } = await supabase
      .from("polls")
      .update({
        closed:true,
      })
      .eq("pda", pollPda);

    if (error) {
      console.error(error);
      throw error;
    }

    return data;
}