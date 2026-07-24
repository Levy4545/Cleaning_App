import Link from "next/link";

import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  userEmail?: string;
};

export function Header({ userEmail }: HeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="text-lg font-semibold text-slate-900">
          Cleaning App
        </Link>

        <div className="flex items-center gap-4">
          {userEmail ? (
            <>
              <span className="hidden text-sm text-slate-600 sm:inline">{userEmail}</span>
              <form action={signOut}>
                <Button type="submit" variant="ghost" size="sm">
                  Sign out
                </Button>
              </form>
            </>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
