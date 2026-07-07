import { redirect } from "next/navigation";

import { BottomNav } from "@/components/nav/BottomNav";
import { getCurrentUser } from "@/lib/auth";

type Props = LayoutProps<"/">;

// Каждый экран несёт свою шапку (ScreenHeader) по макету FridgeMind.dc.html, поэтому общий
// layout — только скролл-контейнер под контент и нижняя навигация.
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
