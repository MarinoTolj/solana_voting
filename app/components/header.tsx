import Link from "next/link";

export function Header() {
  return (
    <header style={{ padding: 16, borderBottom: "1px solid #ccc" }}>
      <nav>
        <Link href="/">Home</Link>
      </nav>
    </header>
  );
}