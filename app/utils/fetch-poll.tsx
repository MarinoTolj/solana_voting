"use server";

import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";
import { PollRow } from "../lib/db-table";

export default async function fetchPollFromDb(
  pollPda: Address<string>
): Promise<PollRow> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("pda", pollPda)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data as PollRow;
}
