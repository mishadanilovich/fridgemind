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

export const NETWORK_ERROR =
  "Нет соединения с сервером — изменение не сохранено. Проверьте интернет и попробуйте ещё раз.";

// redirect()/notFound() из server action долетают до клиента исключением со служебным
// digest — их гасить нельзя, они обрабатываются самим Next.
function isNextInternalError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest: unknown }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_")
  );
}

/**
 * Вызов императивного server action из клиента: сетевой сбой (офлайн, обрыв) превращается
 * в обычный `{ error }` для показа в форме, а не в необработанное исключение, роняющее
 * весь экран в error boundary.
 */
export async function callAction<T extends { error: string | null }>(
  run: () => Promise<T>,
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (isNextInternalError(error)) throw error;
    // Остальные поля T в ошибочной ветке не читаются — все результаты экшенов
    // дискриминированы по error.
    return { error: NETWORK_ERROR } as T;
  }
}

/** То же для экшенов форм (useActionState): сетевой сбой → FormState с общей ошибкой. */
export function guardFormAction<TValues extends object, TData>(
  action: (
    state: FormState<TValues, TData>,
    formData: FormData,
  ) => Promise<FormState<TValues, TData>>,
): (state: FormState<TValues, TData>, formData: FormData) => Promise<FormState<TValues, TData>> {
  return async (state, formData) => {
    try {
      return await action(state, formData);
    } catch (error) {
      if (isNextInternalError(error)) throw error;
      return { error: NETWORK_ERROR };
    }
  };
}

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
