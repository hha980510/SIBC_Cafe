import { ImageResponse } from "next/og";

// 카카오톡 등에 링크를 공유했을 때 뜨는 썸네일(미리보기 카드) 이미지입니다.
// Next.js가 이 파일을 보고 자동으로 og:image 메타태그를 만들어줍니다.
export const runtime = "edge";
export const alt = "MAIM CAFE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  // 한글이 깨지지(네모 박스로 나오지) 않도록 한글이 포함된 폰트를 따로 불러와 적용합니다.
  // (Satori 기본 폰트는 라틴 문자만 지원해서 한글은 별도 폰트가 꼭 필요해요)
  const notoSansKRBold = await fetch(new URL("./fonts/NotoSansKR-Bold.ttf", import.meta.url)).then(
    (res) => res.arrayBuffer()
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          backgroundImage: "linear-gradient(135deg, #123a2b 0%, #072019 100%)",
        }}
      >
        {/* 배지 로고 (components/MaimLogo.js의 SVG 디자인을 그대로 재현) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 300,
            height: 300,
            borderRadius: "50%",
            backgroundColor: "#c6a664",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 288,
              height: 288,
              borderRadius: "50%",
              backgroundColor: "#0d2e22",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 252,
                height: 252,
                borderRadius: "50%",
                border: "1px solid rgba(232,207,148,0.35)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  color: "#f7f3ea",
                  fontSize: 68,
                  fontWeight: 700,
                  letterSpacing: 6,
                }}
              >
                MAIM
              </div>
              <div
                style={{
                  display: "flex",
                  width: 96,
                  height: 2,
                  backgroundColor: "#c6a664",
                  margin: "14px 0",
                }}
              />
              <div
                style={{
                  display: "flex",
                  color: "#c6a664",
                  fontSize: 26,
                  fontWeight: 600,
                  letterSpacing: 10,
                }}
              >
                CAFE
              </div>
            </div>
          </div>
        </div>

        {/* 카페 이름 + 부제 */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              color: "#f7f3ea",
              fontSize: 108,
              fontWeight: 700,
              letterSpacing: 2,
            }}
          >
            MAIM CAFE
          </div>
          <div
            style={{
              display: "flex",
              color: "#c6a664",
              fontSize: 36,
              fontWeight: 600,
              marginTop: 18,
              fontFamily: "NotoSansKR",
            }}
          >
            온라인 주문 · Order Online
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "NotoSansKR",
          data: notoSansKRBold,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
