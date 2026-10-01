import type { Metadata } from "next";
import { LoginPageView } from "@/components/modals/LoginPageView";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in with your mobile number for faster checkout, order tracking and saved journeys.",
};

export default function LoginPage() {
  return <LoginPageView />;
}
