// MOCK — replace with the backend OTP endpoints. The demo OTP is shown in
// the UI on purpose; a real implementation never returns the code.
import { sleep } from "@/lib/utils";
import type { ServiceResult, User } from "@/types";

export const DEMO_OTP = "123456";
export const PHONE_REGEX = /^[6-9]\d{9}$/;

export async function sendMockOTP(phone: string): Promise<ServiceResult<{ sent: true; demoCode: string; resendIn: number }>> {
  await sleep(900);
  if (!PHONE_REGEX.test(phone)) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Enter a valid 10-digit Indian mobile number." } };
  }
  return { ok: true, data: { sent: true, demoCode: DEMO_OTP, resendIn: 30 } };
}

export async function verifyMockOTP(phone: string, code: string, profile?: { name?: string; email?: string }): Promise<ServiceResult<User>> {
  await sleep(1100);
  if (code !== DEMO_OTP) {
    return { ok: false, error: { code: "INVALID_OTP", message: "That code didn't match. Try the demo code shown above." } };
  }
  return { ok: true, data: { name: profile?.name?.trim() || "Traveller", phone, email: profile?.email?.trim() || undefined } };
}
