import { SignupForm } from "@/components/auth/SignupForm";

type Props = PageProps<"/signup">;

export default async function SignupPage({ searchParams }: Props) {
  const { invite } = await searchParams;

  return <SignupForm inviteCode={typeof invite === "string" ? invite : undefined} />;
}
