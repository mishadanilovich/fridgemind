"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { Button, type ButtonProps } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  /** Ведущая иконка; при pending заменяется спиннером (см. Button). */
  icon?: ReactNode;
};

// Для форм на серверном экшене без useActionState (progressive enhancement): читает pending
// текущей формы и сам показывает спиннер/дизейбл. Должен рендериться внутри <form>.
export function SubmitButton({ children, className, variant, size, icon }: Props) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      loading={pending}
      variant={variant}
      size={size}
      icon={icon}
      className={className}
    >
      {children}
    </Button>
  );
}
