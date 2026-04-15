import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ReactNode } from "react";
import ProtectedShell from "./protected-shell";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 md:flex md:items-center md:justify-center md:p-4">
      <div className="h-[100dvh] w-full overflow-hidden bg-slate-50 md:h-[calc(100dvh-2rem)] md:w-full md:max-w-[430px]">
        <ProtectedShell>{children}</ProtectedShell>
      </div>
    </div>
  );
}
