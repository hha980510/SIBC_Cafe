import "./globals.css";

// 카톡 등에 링크를 공유했을 때 미리보기 카드(썸네일 이미지 + 이름)가 뜨도록
// Open Graph 메타데이터를 설정합니다. 썸네일 이미지 자체는 app/opengraph-image.js가
// 자동으로 만들어줍니다 (og:image로 자동 연결됨).
//
// metadataBase는 썸네일 이미지 주소를 절대경로(https://...)로 만드는 데 필요합니다.
// NEXT_PUBLIC_SITE_URL을 Vercel 환경변수에 따로 설정해두면 그 값을 우선 쓰고,
// 없으면 Vercel이 배포마다 자동으로 넣어주는 프로덕션 도메인을 사용합니다.
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.startsWith("http") ? explicit : `https://${explicit}`;
  const prodUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (prodUrl) return `https://${prodUrl}`;
  const deployUrl = process.env.VERCEL_URL;
  if (deployUrl) return `https://${deployUrl}`;
  return "http://localhost:3000";
}

const SITE_NAME = "MAIM CAFE";
const SITE_DESCRIPTION = "MAIM CAFE 온라인 주문 — 메뉴를 고르고 바로 주문해보세요";

export const metadata = {
  metadataBase: new URL(resolveSiteUrl()),
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
