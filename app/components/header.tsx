import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-border bg-card">
      <nav className="mx-auto max-w-6xl px-6 py-3">
        <Link href="/" className="text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors">
          Home
        </Link>
      </nav>
    </header>
  );
}