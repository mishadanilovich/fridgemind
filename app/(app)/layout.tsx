import { redirect } from "next/navigation";

import { BottomNav } from "@/components/nav/BottomNav";
import { getCurrentUser } from "@/lib/auth";

type Props = LayoutProps<"/">;

export default async function AppLayout({ children }: Props) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="pb-24">
      <main className="mx-auto min-h-screen max-w-md px-5 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
