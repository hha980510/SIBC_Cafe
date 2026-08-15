import "./globals.css";

export const metadata = {
  title: "SIBC CAFE",
  description: "SIBC 카페 온라인 주문",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
