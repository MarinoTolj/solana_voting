"use server";

import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";

export default async function closePoll(pollPda: Address<string>) {
  const supabase = createClient();

  const { error } = await supabase
    .from("polls")
    .update({ closed: true })
    .eq("pda", pollPda);

  if (error) throw error;
}
