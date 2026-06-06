import "./globals.css";

export const metadata = {
  title: "과몰입러 인증",
  description: "과몰입을 인증하는 로컬 전용 게시판",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
