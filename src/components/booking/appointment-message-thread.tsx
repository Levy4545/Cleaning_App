"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";

import { listAppointmentMessages, sendAppointmentMessage } from "@/actions/messages";
import { useRealtimeNotifications } from "@/components/realtime/realtime-provider";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { localeTag } from "@/i18n/format";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

type MessageRow = {
  id: string;
  body: string;
  sentAt: string;
  senderName: string | null;
  senderEmail: string;
  isMine: boolean;
};

/** While a thread is open, poll as a safety net if Realtime drops. */
const THREAD_FALLBACK_MS = 8_000;

export function AppointmentMessageThread({ appointmentId }: { appointmentId: string }) {
  const { t, locale } = useI18n();
  const { messageTick, connected } = useRealtimeNotifications();
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLLIElement | null>(null);
  const prevTick = useRef(messageTick);

  const load = useCallback(() => {
    startTransition(async () => {
      const result = await listAppointmentMessages(appointmentId);
      if (result.success && result.data) {
        setMessages(result.data);
      }
    });
  }, [appointmentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Live reload when Realtime signals a messages INSERT/UPDATE.
  useEffect(() => {
    if (messageTick === prevTick.current) return;
    prevTick.current = messageTick;
    load();
  }, [messageTick, load]);

  // Short fallback poll while this thread is mounted (faster when disconnected).
  useEffect(() => {
    const ms = connected ? THREAD_FALLBACK_MS * 2 : THREAD_FALLBACK_MS;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, ms);
    return () => clearInterval(timer);
  }, [load, connected]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  const onSend = () => {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    startTransition(async () => {
      const result = await sendAppointmentMessage({ appointmentId, body });
      if (!result.success) {
        setError(result.error ?? t("messages.sendFailed"));
        return;
      }
      setDraft("");
      load();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
      <p className="text-[10px] font-medium uppercase tracking-wider text-faint">
        {t("messages.title")}
      </p>

      <ul className="max-h-56 space-y-2 overflow-y-auto">
        {messages.length === 0 ? (
          <li className="text-sm text-faint">{t("messages.empty")}</li>
        ) : (
          messages.map((message, index) => (
            <li
              key={message.id}
              ref={index === messages.length - 1 ? bottomRef : null}
              className={cn(
                "rounded-lg px-3 py-2 text-sm",
                message.isMine
                  ? "ml-8 bg-gold/10 text-bone"
                  : "mr-8 border border-line bg-panel text-ash",
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-faint">
                {message.isMine ? t("common.you") : (message.senderName ?? message.senderEmail)}{" "}
                · {new Date(message.sentAt).toLocaleString(localeTag(locale))}
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
          placeholder={t("messages.placeholder")}
          rows={2}
        />
        <div className="flex justify-end">
          <Button size="sm" disabled={isPending || !draft.trim()} onClick={onSend}>
            <Send className="h-3.5 w-3.5" />
            {t("common.send")}
          </Button>
        </div>
      </div>

      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
