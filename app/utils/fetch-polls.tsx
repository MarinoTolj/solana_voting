import { PollRow } from "../lib/db-table";
import { createClient } from "./supabase/client";

export default async function FetchPolls(): Promise<PollRow[]> {
  const supabase = createClient();

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
