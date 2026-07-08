import { Avatar } from "@/components/ui/avatar";

type Props = {
  name: string;
  email: string;
};

export function ProfileHeader({ name, email }: Props) {
  return (
    <div className="flex items-center gap-3.5 rounded-card border border-border bg-card p-4 shadow-card">
      <Avatar name={name} size="lg" tone="primary" />
      <div className="min-w-0">
        <p className="truncate font-heading text-xl font-bold">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
