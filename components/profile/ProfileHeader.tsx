import { Avatar } from "@/components/ui/avatar";

type Props = {
  name: string;
  email: string;
};

export function ProfileHeader({ name, email }: Props) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} size="lg" tone="primary" />
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
