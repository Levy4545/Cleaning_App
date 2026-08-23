"use client";

import { useEffect, useState, useTransition } from "react";
import { Send } from "lucide-react";

import { listAppointmentMessages, sendAppointmentMessage } from "@/actions/messages";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type MessageRow = {
  id: string;
  body: string;
  sentAt: string;
  senderName: string | null;
  senderEmail: string;
  isMine: boolean;
};

export function AppointmentMessageThread({ appointmentId }: { appointmentId: string }) {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = () => {
    startTransition(async () => {
      const result = await listAppointmentMessages(appointmentId);
      if (result.success && result.data) {
        setMessages(result.data);
      }
    });
  };

  useEffect(() => {
    load();
  }, [appointmentId]);

  const onSend = () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const result = await sendAppointmentMessage({ appointmentId, body });
      if (!result.success) {
        setError(result.error ?? "Could not send");
        return;
      }
      setDraft("");
      load();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-faint">Messages</p>

      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <li className="text-sm text-faint">No messages yet. Leave a note about this booking.</li>
        ) : (
          messages.map((message) => (
            <li
              key={message.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                message.isMine
                  ? "ml-8 bg-gold/10 text-bone"
                  : "mr-8 border border-line bg-panel text-ash",
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-faint">
                {message.isMine
                  ? "You"
                  : (message.senderName ?? message.senderEmail)}{" "}
                · {new Date(message.sentAt).toLocaleString()}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{message.body}</p>
            </li>
          ))
        )}
      </ul>

      <div className="space-y-2">
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Write a message…"
          rows={2}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={isPending || !draft.trim()} onClick={onSend}>
            <Send className="h-3.5 w-3.5" />
            Send
          </Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
