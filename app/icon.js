import { ImageResponse } from "next/og";

// 브라우저 탭/카톡 프로필류 아이콘에 쓰이는 파비콘입니다. (32x32라 글자 대신 모노그램만 표시)
export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          backgroundColor: "#c6a664",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 29,
            height: 29,
            borderRadius: "50%",
            backgroundColor: "#0d2e22",
            color: "#f7f3ea",
            fontSize: 20,
            fontWeight: 700,
          }}
        >
          M
        </div>
      </div>
    ),
    { ...size }
  );
}
