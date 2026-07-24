import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { getCurrentUser } from "@/actions/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Cleaning App",
  description: "Production-ready SaaS starter with Next.js and Supabase",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Header userEmail={user?.email} />
        {children}
      </body>
    </html>
  );
}
