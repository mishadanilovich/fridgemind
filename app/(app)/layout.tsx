import { redirect } from "next/navigation";

import { BottomNav } from "@/components/nav/BottomNav";
import { ProfileLink } from "@/components/nav/ProfileLink";
import { getCurrentUser } from "@/lib/auth";

type Props = LayoutProps<"/">;

export default async function AppLayout({ children }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="pb-24">
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="font-heading text-lg font-bold">FridgeMind</span>
        <ProfileLink />
      </header>
      <main className="mx-auto max-w-md px-4 py-4">{children}</main>
      <BottomNav />
    </div>
  );
}
