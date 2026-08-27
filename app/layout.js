import "./globals.css";

export const metadata = {
  title: "MAIM CAFE",
  description: "MAIM CAFE 온라인 주문",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
