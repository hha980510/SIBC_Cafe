// MAIM CAFE 워드마크 로고. 순수 SVG라 어떤 크기로 키워도 흐려지지 않고,
// 메인 히어로/배너, 관리자 화면 등 어디에든 재사용할 수 있습니다.
export default function MaimLogo({ size = 96, className = "" }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="MAIM CAFE 로고"
    >
      <defs>
        <linearGradient id="maimRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e8cf94" />
          <stop offset="100%" stopColor="#c6a664" />
        </linearGradient>
        <radialGradient id="maimBg" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor="#123a2b" />
          <stop offset="100%" stopColor="#072019" />
        </radialGradient>
      </defs>

      {/* 배지 배경 */}
      <circle cx="100" cy="100" r="94" fill="url(#maimBg)" />
      <circle cx="100" cy="100" r="94" fill="none" stroke="url(#maimRing)" strokeWidth="3" />
      <circle cx="100" cy="100" r="84" fill="none" stroke="#e8cf94" strokeOpacity="0.35" strokeWidth="1" />

      {/* 김(스팀) */}
      <g stroke="#e8cf94" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M78 52c-6 -8 6 -12 0 -22" />
        <path d="M100 48c-6 -8 6 -12 0 -22" />
        <path d="M122 52c-6 -8 6 -12 0 -22" />
      </g>

      {/* MAIM 워드마크 */}
      <text
        x="100"
        y="116"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="40"
        fontWeight="700"
        letterSpacing="6"
        fill="#f7f3ea"
      >
        MAIM
      </text>

      {/* 구분선 */}
      <line x1="66" y1="132" x2="134" y2="132" stroke="#c6a664" strokeWidth="1.4" />

      {/* CAFE */}
      <text
        x="100"
        y="148"
        textAnchor="middle"
        fontFamily="'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif"
        fontSize="15"
        fontWeight="600"
        letterSpacing="7"
        fill="#c6a664"
      >
        CAFE
      </text>
    </svg>
  );
}
