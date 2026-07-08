/**
 * Единое состояние форм для server actions + useActionState (см. CLAUDE.md, раздел 10).
 *
 * TValues — поля формы, возвращаемые из экшена при ошибке для восстановления
 * введённого (React сбрасывает форму после сабмита): `defaultValue={state.values?.email}`.
 * TData — полезная нагрузка успешного завершения, когда экшен не заканчивается
 * redirect'ом (например, `{ sentTo: string }` для экрана «проверьте почту»).
 */
export type FormState<TValues extends object = Record<string, never>, TData = never> = {
  error: string | null;
  /** Ошибки конкретных полей (ключ = поле Zod-схемы) — рендерятся под полями формы. */
  fieldErrors?: Record<string, string>;
  values?: Partial<TValues>;
  data?: TData;
};

export const initialFormState = { error: null } satisfies FormState;

/**
 * Результат императивных (не форм) server actions — читается клиентом для показа ошибки.
 * Живёт здесь, а не в "use server"-модуле, где тип пришлось бы кросс-импортировать.
 */
export type ActionResult = { error: string | null };

/** Первое сообщение об ошибке из Zod-issues — для показа под формой. */
export function firstIssue(issues: { message: string }[]): string {
  return issues[0]?.message ?? "Проверьте введённые данные";
}

/**
 * Раскладывает Zod-issues по верхнеуровневым полям схемы (первый issue на поле) —
 * для FormState.fieldErrors. Вложенные пути (ingredients[0].quantity) относятся
 * к своему верхнему полю.
 */
export function fieldIssues(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field !== undefined && errors[String(field)] === undefined) {
      errors[String(field)] = issue.message;
    }
  }
  return errors;
}
