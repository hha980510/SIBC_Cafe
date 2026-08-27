import { Redis } from "@upstash/redis";

// Vercel 마켓플레이스에서 Upstash Redis(또는 Vercel KV)를 연결하면
// 프로젝트 환경변수 이름이 UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// 또는 KV_REST_API_URL / KV_REST_API_TOKEN 중 하나로 생성될 수 있어
// 두 가지 이름을 모두 지원하도록 했습니다.
const url =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url || !token) {
  console.warn(
    "[SIBC Cafe] Redis 환경변수가 설정되지 않았습니다. Vercel에서 Upstash Redis를 연결하고 " +
      "환경변수(UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN)를 확인해주세요."
  );
}

export const redis = new Redis({
  url: url || "",
  token: token || "",
});

export const ORDERS_KEY = "sibc_cafe:orders";
export const MENU_KEY = "sibc_cafe:menu";
