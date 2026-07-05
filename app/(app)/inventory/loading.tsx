import { ListRowSkeletonGroup } from "@/components/skeletons/ListRowSkeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Домашние запасы</h1>
      <ListRowSkeletonGroup rows={3} />
      <ListRowSkeletonGroup rows={2} />
    </div>
  );
}
