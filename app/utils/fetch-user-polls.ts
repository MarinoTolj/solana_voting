"use server";

import { Address } from "@solana/kit";
import { createClient } from "./supabase/client";
import { PollRow } from "../lib/db-table";

export default async function fetchUserPollsFromDb(
  created_by: Address<string>
): Promise<PollRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("created_by", created_by)
    .order("closed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return data as PollRow[];
}
