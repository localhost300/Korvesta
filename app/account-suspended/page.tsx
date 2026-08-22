import Link from "next/link";
import { AuthShell } from "@/components/AuthShell";
export default function Page() {
  return (
    <AuthShell>
      <main className="container-shell mx-auto max-w-xl py-24 text-center">
        <h1 className="text-3xl font-semibold">Account suspended</h1>
        <p className="mt-4 text-sm text-muted">
          Access to this account has been suspended. Financial actions and
          dashboard access are unavailable.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/support" className="gold-button">
            Contact support
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="dash-button">Sign out</button>
          </form>
        </div>
      </main>
    </AuthShell>
  );
}
