import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-wide text-blue-600">
        SaaS Starter
      </p>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Cleaning App — Next.js + Supabase + Drizzle
      </h1>
      <p className="mt-4 max-w-xl text-lg text-slate-600">
        A production-ready foundation for dashboards, internal tools, admin panels, and customer
        portals.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/register">
          <Button size="lg">Get started</Button>
        </Link>
        <Link href="/login">
          <Button size="lg" variant="outline">
            Sign in
          </Button>
        </Link>
      </div>
    </main>
  );
}
