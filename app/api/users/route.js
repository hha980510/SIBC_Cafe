import { NextResponse } from "next/server";
import { redis, USERS_KEY } from "@/lib/redis";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function parseUsers(raw) {
  if (!raw) return null;
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : null;
}

// 손님 주문 화면의 이름 드롭다운에서도 봐야 하므로 조회는 누구나 가능합니다.
export async function GET() {
  try {
    const stored = await redis.get(USERS_KEY);
    const users = parseUsers(stored);
    if (users) {
      return NextResponse.json({ users });
    }
    // 아직 저장된 사용자 목록이 없으면(최초 배포 등) 빈 목록으로 초기화합니다.
    await redis.set(USERS_KEY, []);
    return NextResponse.json({ users: [] });
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ users: [] });
  }
}

// 관리자 "사용자 관리" 화면에서 이름 추가/삭제, 적립금 조정을 저장할 때 사용합니다.
// 목록 전체를 통째로 교체합니다.
// balance(적립금)는 price와 마찬가지로 센트(USD) 단위 정수로 저장합니다. 예: 500 = $5.00
// 주문 시 자동 출금으로 잔액이 마이너스(외상)가 될 수 있어 0 미만도 허용합니다.
export async function PUT(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const rawUsers = Array.isArray(body?.users) ? body.users : null;
    if (!rawUsers) {
      return NextResponse.json({ error: "사용자 데이터 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const seenIds = new Set();
    const cleanUsers = rawUsers
      .map((u, idx) => {
        const name = String(u?.name || "").trim().slice(0, 30);
        let id = String(u?.id || "").trim();
        if (!id) id = `user-${idx}-${Math.random().toString(36).slice(2, 8)}`;
        const balance = Math.round(Number(u?.balance) || 0);
        return { id, name, balance };
      })
      .filter((u) => u.name)
      .filter((u) => {
        if (seenIds.has(u.id)) return false;
        seenIds.add(u.id);
        return true;
      });

    await redis.set(USERS_KEY, cleanUsers);
    return NextResponse.json({ users: cleanUsers });
  } catch (err) {
    console.error("[PUT /api/users]", err);
    return NextResponse.json({ error: "사용자 저장에 실패했습니다." }, { status: 500 });
  }
}
