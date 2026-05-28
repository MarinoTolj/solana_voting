import { PollRow } from "../lib/db-table";
import { createClient } from "./supabase/client";

export default async function FetchPolls():Promise<PollRow[]>{
    const supabase = createClient();

    const { data: polls, error } = await supabase
    .from('polls')
    .select('*')

    if (error) {
      console.error(error);
      throw error;
    }

    return polls as PollRow[];
}