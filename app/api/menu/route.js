import { NextResponse } from "next/server";
import { redis, MENU_KEY } from "@/lib/redis";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { CATEGORIES as DEFAULT_CATEGORIES } from "@/lib/menu";

export const dynamic = "force-dynamic";

function parseCategories(raw) {
  if (!raw) return null;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : null;
}

// 손님 주문 화면에서도 최신 메뉴를 봐야 하므로 조회는 누구나 가능합니다.
export async function GET() {
  try {
    const stored = await redis.get(MENU_KEY);
    const categories = parseCategories(stored);
    if (categories) {
      return NextResponse.json({ categories });
    }
    // 아직 저장된 메뉴가 없으면(최초 배포 등) 기본 메뉴로 초기화합니다.
    await redis.set(MENU_KEY, DEFAULT_CATEGORIES);
    return NextResponse.json({ categories: DEFAULT_CATEGORIES });
  } catch (err) {
    console.error("[GET /api/menu]", err);
    // Redis 연결 문제가 있어도 기본 메뉴는 보여줄 수 있게 폴백합니다.
    return NextResponse.json({ categories: DEFAULT_CATEGORIES });
  }
}

// 관리자 "메뉴 관리" 화면에서 가격 조정/메뉴 추가/활성화-비활성화를 저장할 때 사용합니다.
// 카테고리 배열 전체를 통째로 교체합니다.
export async function PUT(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawCategories = Array.isArray(body?.categories) ? body.categories : null;
    if (!rawCategories) {
      return NextResponse.json({ error: "메뉴 데이터 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const cleanCategories = rawCategories
      .map((cat) => ({
        id: String(cat.id || "").trim(),
        nameKo: String(cat.nameKo || "").trim(),
        nameEn: String(cat.nameEn || "").trim(),
        emoji: typeof cat.emoji === "string" ? cat.emoji : "",
        hasTemp: Boolean(cat.hasTemp),
        isExtra: Boolean(cat.isExtra),
        items: Array.isArray(cat.items)
          ? cat.items
              .map((item) => ({
                id: String(item.id || "").trim(),
                nameKo: String(item.nameKo || "").trim(),
                nameEn: String(item.nameEn || "").trim(),
                price: Math.max(0, Math.round(Number(item.price) || 0)),
                available: item.available !== false,
              }))
              .filter((item) => item.id && item.nameKo)
          : [],
      }))
      .filter((cat) => cat.id && cat.nameKo);

    if (cleanCategories.length === 0) {
      return NextResponse.json({ error: "저장할 메뉴 데이터가 없습니다." }, { status: 400 });
    }

    await redis.set(MENU_KEY, cleanCategories);
    return NextResponse.json({ categories: cleanCategories });
  } catch (err) {
    console.error("[PUT /api/menu]", err);
    return NextResponse.json({ error: "메뉴 저장에 실패했습니다." }, { status: 500 });
  }
}
