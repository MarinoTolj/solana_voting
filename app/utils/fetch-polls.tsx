"use server";

import { cookies } from "next/headers";
import { PollRow } from "../lib/db-table";
import { createClient } from "./supabase/server";

export default async function fetchPollsFromDb(): Promise<PollRow[]> {
  const supabase = createClient(await cookies());

  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .order("closed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return data as PollRow[];
}
