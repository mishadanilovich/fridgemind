type Props = {
  name: string;
  email: string;
};

// Аватар — первая буква имени (без загрузки фото в MVP, см. раздел 6).
export function ProfileHeader({ name, email }: Props) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
        {initial}
      </div>
      <div className="min-w-0">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}
