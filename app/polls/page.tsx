import fetchPollsFromDb from "../utils/fetch-polls";
import PollList from "../components/poll-list";

export default async function Polls() {
  const polls = await fetchPollsFromDb();

  return <PollList polls={polls} scope="all" />;
}
