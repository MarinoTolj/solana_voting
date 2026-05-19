import { cookies } from 'next/headers'
import { createClient } from '../utils/supabase/server'
import Link from 'next/link';
import FetchPolls from '../utils/fetch-polls';

export default async function Polls() {
  const polls = await FetchPolls();

  return (
    <ul>
      {polls?.map((poll) => (
        <li key={poll.id}>
          <Link href={`/poll/${poll.pda}`}>
            {poll.pda}
          </Link>
          {' '}created by: {poll.created_by}
          Result:
          {
            poll.results==null
            ?<div>Voting has not yet ended</div>
            :( 
              Array.from({ length: Number(poll.results.results.length) }).map((_, i) => (
                <p key={i}>{poll.results.results[i].candidateName}, votes:{poll.results.results[i].votes}</p>
              ))
            )

          }
          
        </li>
      ))}
    </ul>
  )
}