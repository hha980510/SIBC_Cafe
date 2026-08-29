import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis, LEDGER_KEY } from "@/lib/redis";
import { isAdminAuthorized } from "@/lib/adminAuth";
import { getUsers, adjustUserBalance } from "@/lib/users";

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

// 회계 탭: 입출금 기록입니다. 금액이 들어있는 화면이라 관리자만 볼 수 있게 막습니다.
export async function GET(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const raw = await redis.lrange(LEDGER_KEY, 0, -1);
    const transactions = raw.map(parseTx).filter(Boolean).reverse(); // 최신순으로 보여줍니다.
    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("[GET /api/ledger]", err);
    return NextResponse.json({ error: "기록을 불러오지 못했습니다." }, { status: 500 });
  }
}

// 관리자가 "회계" 탭에서 특정 사용자에게 입금(충전)을 추가할 때 사용합니다.
// 출금(주문 결제)은 손님이 주문을 넣을 때 /api/orders에서 자동으로 기록됩니다.
export async function POST(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const userId = String(body?.userId || "").trim();
    const amount = Math.round(Number(body?.amount) || 0);
    const note = typeof body?.note === "string" ? body.note.trim().slice(0, 60) : "";

    if (!userId) {
      return NextResponse.json({ error: "입금할 사용자를 선택해주세요." }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "입금액을 올바르게 입력해주세요." }, { status: 400 });
    }

    const users = await getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: "존재하지 않는 사용자예요." }, { status: 400 });
    }

    const updatedUser = await adjustUserBalance(userId, amount);

    const tx = {
      id: randomUUID(),
      type: "deposit",
      userId,
      userName: user.name,
      amount,
      note,
      orderId: null,
      createdAt: new Date().toISOString(),
    };
    await redis.rpush(LEDGER_KEY, tx);

    return NextResponse.json({ transaction: tx, user: updatedUser }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/ledger]", err);
    return NextResponse.json({ error: "입금 처리에 실패했습니다." }, { status: 500 });
  }
}
