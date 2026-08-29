// 회계(입출금) 기능에서 사용자 잔액을 읽고 조정할 때 쓰는 공용 헬퍼입니다.
// app/api/users/route.js, app/api/orders/route.js, app/api/ledger/route.js에서
// 같은 로직을 중복하지 않도록 여기 모아뒀습니다.
import { redis, USERS_KEY } from "./redis";

export async function getUsers() {
  const raw = await redis.get(USERS_KEY);
  const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
  return Array.isArray(parsed) ? parsed : [];
}

export async function saveUsers(users) {
  await redis.set(USERS_KEY, users);
}

// userId의 balance(센트 단위)를 deltaCents만큼 더합니다. (음수를 넘기면 차감)
// 반환값: 갱신된 사용자 객체, 대상이 없으면 null.
export async function adjustUserBalance(userId, deltaCents) {
  const users = await getUsers();
  let updatedUser = null;
  const next = users.map((u) => {
    if (u.id !== userId) return u;
    updatedUser = { ...u, balance: Math.round((u.balance || 0) + deltaCents) };
    return updatedUser;
  });
  if (updatedUser) {
    await saveUsers(next);
  }
  return updatedUser;
}
