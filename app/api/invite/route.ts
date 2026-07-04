import { NextResponse } from "next/server";

// Поток "создание household и приглашение участников" (см. CLAUDE.md, раздел 6).
// Генерация/инвалидация inviteCode — доступно любому участнику для просмотра ссылки,
// но "Сгенерировать новую ссылку" по дизайну видна только после раскрытия "Пригласить" (UI-деталь).

export async function POST() {
  // TODO: regenerate Household.inviteCode (invalidates old link), только вызывается явным действием
  return NextResponse.json({ inviteCode: "TODO" });
}

// Принятие приглашения по коду — см. поток в разделе 6, шаг 3 (новый пользователь / уже в другом household / уже здесь)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // TODO: найти Household по inviteCode, обработать 3 случая из потока в CLAUDE.md
  return NextResponse.json({ householdId: null, code });
}
