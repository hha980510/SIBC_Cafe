import { NextResponse } from "next/server";
import { redis, LEDGER_KEY } from "@/lib/redis";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { adjustUserBalance } from "@/lib/users";

export const dynamic = "force-dynamic";

function parseTx(item) {
  if (typeof item === "string") {
    try {
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  }
  return item;
}

async function loadAll() {
  const raw = await redis.lrange(LEDGER_KEY, 0, -1);
  return raw.map(parseTx).filter(Boolean);
}

async function saveAll(list) {
  await redis.del(LEDGER_KEY);
  if (list.length > 0) {
    await redis.rpush(LEDGER_KEY, ...list);
  }
}

// 회계 내역 한 건을 수정합니다. (금액/메모를 잘못 입력했을 때 바로잡는 용도)
// 금액이 바뀌면 그 차이만큼 사용자 잔액도 함께 보정해서, 잔액이 어긋나지 않게 합니다.
export async function PATCH(request, { params }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const list = await loadAll();
    const idx = list.findIndex((tx) => tx.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "해당 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const original = list[idx];
    const nextAmount =
      body.amount === undefined || body.amount === null
        ? original.amount
        : Math.round(Number(body.amount) || 0);
    let nextNote =
      typeof body.note === "string" ? body.note.trim().slice(0, 60) : original.note;
    if (!nextNote && original.type === "deposit") {
      nextNote = "입금";
    }

    if (!nextAmount || nextAmount <= 0) {
      return NextResponse.json({ error: "금액을 올바르게 입력해주세요." }, { status: 400 });
    }

    const updated = { ...original, amount: nextAmount, note: nextNote };
    list[idx] = updated;
    await saveAll(list);

    // 잔액 보정: 금액 차이만큼, 거래 방향(입금이면 +, 출금이면 -)에 맞게 반영합니다.
    const diff = nextAmount - original.amount;
    let updatedUser = null;
    if (diff !== 0 && original.userId) {
      const delta = original.type === "deposit" ? diff : -diff;
      updatedUser = await adjustUserBalance(original.userId, delta);
    }

    return NextResponse.json({ transaction: updated, user: updatedUser });
  } catch (err) {
    console.error("[PATCH /api/ledger/:id]", err);
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 });
  }
}

// 잘못 등록된 회계 내역을 통째로 삭제합니다. 삭제 시 그 거래가 잔액에 미쳤던 영향도
// 되돌립니다(입금 삭제 → 잔액에서 차감, 출금 삭제 → 잔액에 다시 더함).
export async function DELETE(request, { params }) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const { id } = params;
    const list = await loadAll();
    const idx = list.findIndex((tx) => tx.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "해당 기록을 찾을 수 없습니다." }, { status: 404 });
    }

    const [removed] = list.splice(idx, 1);
    await saveAll(list);

    let updatedUser = null;
    if (removed.userId) {
      const delta = removed.type === "deposit" ? -removed.amount : removed.amount;
      updatedUser = await adjustUserBalance(removed.userId, delta);
    }

    return NextResponse.json({ ok: true, deletedId: id, user: updatedUser });
  } catch (err) {
    console.error("[DELETE /api/ledger/:id]", err);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
}
