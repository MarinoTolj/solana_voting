import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";

export default async function FetchPoll(pollPda:Address<string>){
    const supabase = createClient();

    const { data, error } = await supabase
    .from('polls')
    .select('*')
    .eq("pda", pollPda);

    if (error) {
      console.error(error);
      throw error;
    }

    return data[0];
}