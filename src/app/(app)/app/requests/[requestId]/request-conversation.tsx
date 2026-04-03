"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { sendRequestMessage } from "@/actions/request-messages";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  sender: { id: string; name: string | null; image: string | null; role: string };
};

interface Props {
  requestId: string;
  currentUserId: string;
  initialMessages: Message[];
}

function timeStr(date: Date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RequestConversation({ requestId, currentUserId, initialMessages }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    startTransition(async () => {
      try {
        const msg = await sendRequestMessage(requestId, trimmed);
        setMessages((prev) => [...prev, msg as Message]);
        setText("");
        inputRef.current?.focus();
      } catch {
        // silent
      }
    });
  };

  return (
    <div className="rounded-[22px] border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 px-5 py-3">
        <p className="text-sm font-semibold text-gray-900">Conversation</p>
      </div>

      <div className="max-h-[400px] overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <p className="text-center text-xs text-gray-400 py-6">No messages yet. Start the conversation.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                {msg.sender.image ? (
                  <Image
                    src={msg.sender.image}
                    alt=""
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full shrink-0 object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-600">
                    {msg.sender.name?.[0] ?? "?"}
                  </div>
                )}
                <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isMe
                        ? "bg-[#0F6E56] text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-400 px-1">{timeStr(msg.createdAt)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Write a message…"
          rows={2}
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400 focus:border-[#0F6E56] focus:outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F6E56] text-white hover:bg-[#0d5f4a] disabled:opacity-40 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
