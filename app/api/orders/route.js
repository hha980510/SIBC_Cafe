import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { redis, ORDERS_KEY } from "@/lib/redis";
import { isAdminAuthorized } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function parseOrder(item) {
  if (typeof item === "string") {
    try {
      return JSON.parse(item);
    } catch (e) {
      return null;
    }
  }
  return item;
}

// 관리자 화면에서 전체 주문 목록을 가져올 때 사용합니다.
export async function GET(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    const raw = await redis.lrange(ORDERS_KEY, 0, -1);
    const orders = raw.map(parseOrder).filter(Boolean);
    return NextResponse.json({ orders });
  } catch (err) {
    console.error("[GET /api/orders]", err);
    return NextResponse.json(
      { error: "주문 목록을 불러오지 못했습니다. Redis 연결 설정을 확인해주세요." },
      { status: 500 }
    );
  }
}

// 손님이 주문을 제출할 때 사용합니다. (누구나 접근 가능)
export async function POST(request) {
  try {
    const body = await request.json();
    const customerName = typeof body.customerName === "string" ? body.customerName.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";
    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName) {
      return NextResponse.json({ error: "이름을 입력해주세요." }, { status: 400 });
    }

    const cleanItems = items
      .map((item) => ({
        id: String(item.id || ""),
        name: String(item.name || ""),
        price: Number(item.price) || 0,
        qty: Number(item.qty) || 0,
        temp: item.temp === "HOT" || item.temp === "ICE" ? item.temp : null,
      }))
      .filter((item) => item.id && item.qty > 0);

    if (cleanItems.length === 0) {
      return NextResponse.json({ error: "메뉴를 한 개 이상 선택해주세요." }, { status: 400 });
    }

    const total = cleanItems.reduce((sum, item) => sum + item.price * item.qty, 0);

    const order = {
      id: randomUUID(),
      customerName,
      note,
      items: cleanItems,
      total,
      createdAt: new Date().toISOString(),
    };

    await redis.rpush(ORDERS_KEY, order);

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/orders]", err);
    return NextResponse.json(
      { error: "주문 저장에 실패했습니다. Redis 연결 설정을 확인해주세요." },
      { status: 500 }
    );
  }
}

// 관리자가 영수증을 뽑은 뒤 다음 주문 모음을 위해 목록을 초기화할 때 사용합니다.
export async function DELETE(request) {
  if (!isAdminAuthorized(request)) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  try {
    await redis.del(ORDERS_KEY);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/orders]", err);
    return NextResponse.json({ error: "초기화에 실패했습니다." }, { status: 500 });
  }
}
