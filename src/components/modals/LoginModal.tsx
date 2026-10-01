"use client";

import { Modal } from "@/components/ui";
import { useUIStore } from "@/stores";
import { LoginForm } from "./LoginForm";

export function LoginModal() {
  const open = useUIStore((s) => s.loginOpen);
  const closeLogin = useUIStore((s) => s.closeLogin);
  const loginNext = useUIStore((s) => s.loginNext);
  return (
    <Modal open={open} onClose={closeLogin} size="sm" hideClose={false}>
      <div className="px-6 pb-7 pt-2">
        <LoginForm
          onDone={() => {
            const next = loginNext;
            closeLogin();
            next?.();
          }}
        />
      </div>
    </Modal>
  );
}
