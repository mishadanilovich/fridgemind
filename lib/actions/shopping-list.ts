"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import type { FormState } from "@/lib/form-state";
import { fieldIssues } from "@/lib/form-state";
import { createManualShoppingItem } from "@/lib/queries/shopping-list";
import { manualShoppingItemInputSchema } from "@/lib/zod-schemas";

// Список покупок доступен на запись всем ролям household (см. CLAUDE.md §5,
// RLS shopping_list_items) — достаточно залогиненного пользователя.

export type ManualItemValues = { name: string; quantity: string };
export type ManualItemSaved = { savedId: string };

type ManualItemState = FormState<ManualItemValues, ManualItemSaved>;

export async function addManualShoppingItem(
  _prev: ManualItemState,
  formData: FormData,
): Promise<ManualItemState> {
  const user = await requireUser();

  const raw = {
    name: String(formData.get("name") ?? ""),
    quantity: String(formData.get("quantity") ?? ""),
  };
  const parsed = manualShoppingItemInputSchema.safeParse({
    name: raw.name,
    quantity: Number(raw.quantity) || 0,
    unit: String(formData.get("unit") ?? ""),
    manualCategory: String(formData.get("manualCategory") ?? "OTHER"),
  });
  if (!parsed.success) {
    return { error: null, fieldErrors: fieldIssues(parsed.error.issues), values: raw };
  }

  const saved = await createManualShoppingItem(user.householdId, parsed.data);

  revalidatePath("/shopping-list");
  return { error: null, data: { savedId: saved.id } };
}
