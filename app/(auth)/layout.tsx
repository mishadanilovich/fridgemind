type Props = LayoutProps<"/">;

export default function AuthLayout({ children }: Props) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      {children}
    </main>
  );
}
