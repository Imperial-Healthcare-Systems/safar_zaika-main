"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Input, Textarea } from "@/components/ui";
import { toast } from "@/stores";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      className="mt-12 space-y-4 rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !EMAIL_REGEX.test(email) || message.trim().length < 10) {
          setError("Add your name, a valid email and a message of at least 10 characters.");
          return;
        }
        setError(null);
        toast({ title: "Message sent (demo)", description: "Nothing was actually sent; this is a prototype.", tone: "success" });
        setName("");
        setEmail("");
        setMessage("");
      }}
    >
      <h2 className="font-display text-2xl text-cocoa-900">Send a message</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <Textarea label="Message" rows={5} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
      {error && (
        <p role="alert" className="text-[13px] font-medium text-chili-600">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" rightIcon={<ArrowRight className="size-4" />}>
        Send message
      </Button>
    </form>
  );
}

export function PartnerCta() {
  return (
    <div className="relative mt-12 overflow-hidden rounded-[2.5rem] gradient-cocoa p-8 text-cream-50 sm:p-12">
      <div aria-hidden className="absolute inset-0 map-grid-dark opacity-50" />
      <div className="relative">
        <h2 className="text-balance font-display text-[1.875rem] leading-[1.08] sm:text-[2.25rem]">
          Cook for every train that <span className="text-gold-400">stops nearby.</span>
        </h2>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-cream-50/70">Register interest and we&apos;ll reach out when partner onboarding opens.</p>
        <Button
          variant="light"
          size="lg"
          className="mt-8"
          rightIcon={<ArrowRight className="size-4" />}
          onClick={() => toast({ title: "Interest noted (demo)", description: "Partner onboarding opens later; nothing was submitted." })}
        >
          Partner with us
        </Button>
      </div>
    </div>
  );
}
