import { cookies } from 'next/headers'
import { createClient } from '../utils/supabase/server'
import Link from 'next/link';

export default async function Polls() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: polls, error } = await supabase
    .from('polls')
    .select('*')

  if (error) {
    return <pre>{JSON.stringify(error, null, 2)}</pre>;
  }

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