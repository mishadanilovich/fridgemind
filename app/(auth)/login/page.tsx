import { LoginForm } from "@/components/auth/LoginForm";

type Props = PageProps<"/login">;

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
