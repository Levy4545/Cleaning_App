"use client";

import { Eye, EyeOff } from "lucide-react";
import { type InputHTMLAttributes, useState } from "react";

import { Input } from "@/components/ui/input";

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-10" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-faint transition-colors hover:text-ash focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
