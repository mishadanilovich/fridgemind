import { ProfileSkeleton } from "@/components/skeletons/ProfileSkeleton";

export default function ProfileLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Профиль / Настройки</h1>
      <ProfileSkeleton />
    </div>
  );
}
