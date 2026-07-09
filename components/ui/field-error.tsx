type Props = {
  message?: string | null;
};

/** Текст ошибки под полем/блоком формы — для не-Input контролов (у Input есть проп error). */
export function FieldError({ message }: Props) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm font-medium text-destructive">{message}</p>;
}
