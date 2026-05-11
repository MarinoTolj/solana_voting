type Props = {
  remaining: number; // unix seconds from chain
};

export function Countdown({ remaining }: Props) {
  const seconds = Math.floor(remaining / 1000) % 60;
  const minutes = Math.floor(remaining / 1000 / 60) % 60;
  const hours = Math.floor(remaining / 1000 / 60 / 60);

  return (
    <p>
      Time left: {hours}h {minutes}m {seconds}s
    </p>
  );
}