"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { ArrowLeft, CheckCircle2, Smartphone } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { cn, prefersReducedMotion } from "@/lib/utils";
import { Button, Input, Tabs } from "@/components/ui";
import { DEMO_OTP, PHONE_REGEX, sendMockOTP, verifyMockOTP } from "@/services";
import { toast, useAuthStore } from "@/stores";

type Mode = "login" | "signup";
type Step = "phone" | "otp" | "done";

function OtpInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, ch: string) => {
    const next = digits.slice();
    next[i] = ch;
    onChange(next.join("").slice(0, 6));
  };
  const onKey = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) setAt(i, "");
      else if (i > 0) {
        setAt(i - 1, "");
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      e.preventDefault();
      onChange(text);
      refs.current[Math.min(5, text.length)]?.focus();
    }
  };
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time passcode">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const ch = e.target.value.replace(/\D/g, "").slice(-1);
            setAt(i, ch);
            if (ch && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => onKey(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            "h-14 w-full rounded-xl border bg-white text-center font-condensed text-3xl font-bold text-cocoa-900 outline-none transition-[border-color,box-shadow,transform] focus:border-copper-500 focus:ring-4 focus:ring-copper-500/15",
            error ? "border-chili-500" : d ? "border-copper-400" : "border-line",
          )}
        />
      ))}
    </div>
  );
}

export function LoginForm({ onDone, compact }: { onDone?: () => void; compact?: boolean }) {
  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendIn, setResendIn] = useState(0);
  const login = useAuthStore((s) => s.login);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  useEffect(() => {
    if (prefersReducedMotion() || !panelRef.current) return;
    gsap.fromTo(panelRef.current, { x: 16, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.4, ease: "expo.out" });
  }, [step]);

  const shake = () => {
    if (prefersReducedMotion() || !panelRef.current) return;
    gsap.fromTo(panelRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" });
  };

  const sendCode = async () => {
    setError(null);
    if (!PHONE_REGEX.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      shake();
      return;
    }
    if (mode === "signup" && name.trim().length < 2) {
      setError("Tell us your name so the kitchen knows who to hand the food to.");
      shake();
      return;
    }
    setLoading(true);
    const res = await sendMockOTP(phone);
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      shake();
      return;
    }
    setResendIn(res.data.resendIn);
    setStep("otp");
    setOtp("");
  };

  const verify = async (code = otp) => {
    if (code.length < 6) return;
    setLoading(true);
    setError(null);
    const res = await verifyMockOTP(phone, code, { name, email });
    setLoading(false);
    if (!res.ok) {
      setError(res.error.message);
      shake();
      return;
    }
    login(res.data);
    setStep("done");
    toast({ title: `Welcome, ${res.data.name}!`, tone: "success", description: "You're logged in. Let's get you fed." });
    setTimeout(() => onDone?.(), 900);
  };

  const onOtpChange = (v: string) => {
    setOtp(v);
    if (v.length === 6) void verify(v);
  };

  return (
    <div className={cn(!compact && "pt-2", "max-lg:[&_input]:text-base max-lg:[&_select]:text-base max-lg:[&_textarea]:text-base")}>
      {step !== "done" && (
        <Tabs<Mode>
          full
          value={mode}
          onChange={(m) => {
            setMode(m);
            setStep("phone");
            setError(null);
          }}
          items={[
            { value: "login", label: "Log in" },
            { value: "signup", label: "Sign up" },
          ]}
        />
      )}

      <div ref={panelRef} className="mt-6">
        {step === "phone" && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void sendCode();
            }}
          >
            <div>
              <h2 className="font-display text-3xl text-cocoa-900">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
              <p className="mt-1 text-sm text-muted">{mode === "login" ? "We'll text you a one-time code." : "Takes 20 seconds. No passwords, ever."}</p>
            </div>
            {mode === "signup" && <Input label="Your name" placeholder="e.g. Aarav Mehta" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
            <Input
              label="Mobile number"
              placeholder="10-digit number"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              leftIcon={<span className="text-sm font-semibold text-cocoa-700">+91</span>}
              error={error}
            />
            {mode === "signup" && <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" hint="For order receipts only." />}
            <Button type="submit" full size="lg" loading={loading} leftIcon={<Smartphone className="size-4" />}>
              Send OTP
            </Button>
            <button
              type="button"
              onClick={() => {
                continueAsGuest();
                onDone?.();
              }}
              className="block w-full text-center text-sm font-semibold text-muted hover:text-cocoa-900 max-lg:min-h-11"
            >
              Continue as guest
            </button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <button type="button" onClick={() => setStep("phone")} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-cocoa-900">
              <ArrowLeft className="size-4" /> +91 {phone}
            </button>
            <div>
              <h2 className="font-display text-3xl text-cocoa-900">Enter the code</h2>
              <p className="mt-1 text-sm text-muted">
                Sent to +91 {phone}.{" "}
                <span className="rounded-md bg-gold-200 px-1.5 py-0.5 text-[12px] font-bold text-cocoa-800">Demo code: {DEMO_OTP}</span>
              </p>
            </div>
            <OtpInput value={otp} onChange={onOtpChange} error={Boolean(error)} />
            {error && (
              <p role="alert" className="text-[13px] font-medium text-chili-600">
                {error}
              </p>
            )}
            <Button full size="lg" loading={loading} onClick={() => verify()} disabled={otp.length < 6}>
              Verify &amp; continue
            </Button>
            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={() => onOtpChange(DEMO_OTP)} className="font-semibold text-copper-700 hover:underline">
                Use demo code
              </button>
              <button type="button" disabled={resendIn > 0} onClick={() => void sendCode()} className="font-semibold text-muted enabled:hover:text-cocoa-900 disabled:opacity-60">
                {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-leaf-100 text-leaf-600">
              <CheckCircle2 className="size-8" />
            </span>
            <h2 className="mt-4 font-display text-3xl text-cocoa-900">You&apos;re in</h2>
            <p className="mt-1 text-sm text-muted">Taking you back to your order…</p>
          </div>
        )}
      </div>
    </div>
  );
}
