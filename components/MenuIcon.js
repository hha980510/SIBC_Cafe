import { useId } from "react";
import { ICONS, EXTRA_ICONS, resolveVessel } from "@/lib/menuIcons";

// ---------- 색상 유틸 ----------
function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function toHex({ r, g, b }) {
  const c = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

function lighten(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({ r: r + (255 - r) * amt, g: g + (255 - g) * amt, b: b + (255 - b) * amt });
}

function darken(hex, amt) {
  const { r, g, b } = hexToRgb(hex);
  return toHex({ r: r * (1 - amt), g: g * (1 - amt), b: b * (1 - amt) });
}

// ---------- 토핑 모티프 ----------
function Motif({ type, color, x = 29, y = 26 }) {
  const glossy = lighten(color, 0.55);
  switch (type) {
    case "bean":
      return (
        <g>
          <g fill={color}>
            <ellipse cx={x - 4} cy={y} rx="3.2" ry="5" transform={`rotate(-20 ${x - 4} ${y})`} />
            <ellipse cx={x + 4} cy={y} rx="3.2" ry="5" transform={`rotate(20 ${x + 4} ${y})`} />
          </g>
          <g stroke={glossy} strokeWidth="0.7" strokeLinecap="round" opacity="0.8">
            <path d={`M ${x - 4} ${y - 4} Q ${x - 3.4} ${y} ${x - 4} ${y + 4}`} fill="none" />
            <path d={`M ${x + 4} ${y - 4} Q ${x + 4.6} ${y} ${x + 4} ${y + 4}`} fill="none" />
          </g>
        </g>
      );
    case "cream":
      return (
        <path
          d={`M ${x - 6} ${y + 3} Q ${x - 2} ${y - 5} ${x + 2} ${y} Q ${x + 6} ${y + 5} ${x + 3} ${y - 2}`}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "choco":
    case "caramel":
      return (
        <path
          d={`M ${x - 7} ${y - 2} q3 4 6 0 q3 4 6 0 q3 4 6 0`}
          stroke={color}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      );
    case "stick":
      return (
        <g stroke={color} strokeWidth="2" strokeLinecap="round">
          <line x1={x - 5} y1={y - 5} x2={x + 5} y2={y + 5} />
          <line x1={x - 5} y1={y + 2} x2={x + 3} y2={y - 6} />
        </g>
      );
    case "nut":
      return (
        <g>
          <g fill={color}>
            <ellipse cx={x - 3} cy={y} rx="3" ry="4" />
            <ellipse cx={x + 3} cy={y + 1} rx="3" ry="4" />
          </g>
          <ellipse cx={x - 4} cy={y - 1.5} rx="0.9" ry="1.4" fill={glossy} opacity="0.85" />
          <ellipse cx={x + 2} cy={y - 0.5} rx="0.9" ry="1.4" fill={glossy} opacity="0.85" />
        </g>
      );
    case "drip":
      return (
        <g fill={color}>
          <path d={`M ${x - 4} ${y - 4} q2 4 0 7 q-2 -3 0 -7`} />
          <path d={`M ${x + 3} ${y - 2} q2 4 0 7 q-2 -3 0 -7`} />
        </g>
      );
    case "leaf":
      return (
        <g>
          <path
            d={`M ${x} ${y - 6} C ${x + 7} ${y - 4} ${x + 7} ${y + 4} ${x} ${y + 6} C ${x - 7} ${
              y + 4
            } ${x - 7} ${y - 4} ${x} ${y - 6} Z`}
            fill={color}
          />
          <path
            d={`M ${x} ${y - 5} Q ${x + 3} ${y} ${x} ${y + 5}`}
            fill="none"
            stroke={glossy}
            strokeOpacity="0.7"
            strokeWidth="0.8"
          />
        </g>
      );
    case "fruit":
      return (
        <g>
          <path
            d={`M ${x} ${y - 6} C ${x + 6} ${y - 6} ${x + 6} ${y + 3} ${x} ${y + 6} C ${x - 6} ${
              y + 3
            } ${x - 6} ${y - 6} ${x} ${y - 6} Z`}
            fill={color}
          />
          <ellipse cx={x - 2} cy={y - 2} rx="1.3" ry="1.8" fill={glossy} opacity="0.8" />
          <line x1={x} y1={y - 6} x2={x} y2={y - 9} stroke="#4f7942" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      );
    case "flower":
      return (
        <g fill={color}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx={x}
              cy={y - 4}
              rx="2.2"
              ry="3.4"
              transform={`rotate(${angle} ${x} ${y})`}
            />
          ))}
          <circle cx={x} cy={y} r="1.6" fill="#f2c14e" />
        </g>
      );
    case "citrus":
      return (
        <g>
          <path d={`M ${x - 6} ${y} A6 6 0 0 1 ${x + 6} ${y} Z`} fill={color} fillOpacity="0.92" />
          <g stroke="#ffffff" strokeOpacity="0.65" strokeWidth="0.6">
            <line x1={x} y1={y} x2={x} y2={y - 5} />
            <line x1={x} y1={y} x2={x - 4} y2={y - 3} />
            <line x1={x} y1={y} x2={x + 4} y2={y - 3} />
            <line x1={x} y1={y} x2={x - 2.2} y2={y - 4.6} />
            <line x1={x} y1={y} x2={x + 2.2} y2={y - 4.6} />
          </g>
          <path d={`M ${x - 6} ${y} A6 6 0 0 1 ${x + 6} ${y}`} fill="none" stroke={darken(color, 0.2)} strokeWidth="0.8" />
        </g>
      );
    case "berries":
      return (
        <g>
          <g fill={color}>
            <circle cx={x - 3} cy={y} r="2.6" />
            <circle cx={x + 2} cy={y - 2} r="2.6" />
            <circle cx={x + 1} cy={y + 3} r="2.6" />
          </g>
          <g fill={glossy} opacity="0.8">
            <circle cx={x - 3.7} cy={y - 0.8} r="0.7" />
            <circle cx={x + 1.3} cy={y - 2.8} r="0.7" />
          </g>
          <path d={`M ${x} ${y - 6} l2 -3 l2 3 z`} fill="#4f7942" />
        </g>
      );
    case "grape":
      return (
        <g>
          <g fill={color}>
            <circle cx={x - 3} cy={y - 2} r="2.4" />
            <circle cx={x + 3} cy={y - 2} r="2.4" />
            <circle cx={x - 1.5} cy={y + 2} r="2.4" />
            <circle cx={x + 1.5} cy={y + 2} r="2.4" />
            <circle cx={x} cy={y + 5.5} r="2.4" />
          </g>
          <circle cx={x - 3.6} cy={y - 2.6} r="0.6" fill={glossy} opacity="0.8" />
        </g>
      );
    case "bubble":
      return (
        <g>
          <g fill={color} fillOpacity="0.85">
            <circle cx={x - 4} cy={y + 3} r="1.7" />
            <circle cx={x + 3.2} cy={y - 4} r="1.3" />
            <circle cx={x + 5} cy={y + 2} r="1" />
            <circle cx={x - 1} cy={y - 6} r="1" />
            <circle cx={x + 0.5} cy={y + 5.5} r="1.4" />
          </g>
          <g fill={glossy} opacity="0.85">
            <circle cx={x - 4.5} cy={y + 2.2} r="0.5" />
            <circle cx={x + 2.5} cy={y - 4.7} r="0.4" />
          </g>
        </g>
      );
    case "chip":
      return (
        <g>
          <circle cx={x - 3} cy={y - 2} r="1.4" fill={color} />
          <circle cx={x + 2} cy={y + 1} r="1.4" fill={color} />
          <circle cx={x - 1} cy={y + 3} r="1.4" fill={color} />
          <path
            d={`M ${x + 5} ${y - 5} C ${x + 9} ${y - 5} ${x + 9} ${y - 1} ${x + 5} ${y - 1} Z`}
            fill="#3f9463"
          />
        </g>
      );
    default:
      return null;
  }
}

// ---------- 그릇(vessel) ----------
// 위에서 비스듬히 내려다보는 각도(고각 3/4 뷰)로 통일했습니다: 입구는 넓은 타원으로 열려
// 있어 음료 표면이 그대로 보이고, 몸통은 그 아래로 짧게 이어집니다. liquid 색 하나에서
// 컵/유리 색조와 그림자 톤을 자동으로 뽑아써서 색이 달라도 같은 룩을 유지합니다.
function Mug({ liquid, uid }) {
  const shellLight = lighten(liquid, 0.62);
  const shellMid = lighten(liquid, 0.4);
  const outline = darken(liquid, 0.32);
  const liquidTop = lighten(liquid, 0.14);
  const liquidEdge = darken(liquid, 0.1);
  const bodyId = `${uid}-mugBody`;
  const liquidId = `${uid}-mugLiquid`;
  return (
    <g>
      <ellipse cx="27" cy="56.5" rx="15" ry="2.6" fill="#20140a" opacity="0.12" />
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shellLight} />
          <stop offset="100%" stopColor={shellMid} />
        </linearGradient>
        <radialGradient id={liquidId} cx="40%" cy="35%" r="68%">
          <stop offset="0%" stopColor={liquidTop} />
          <stop offset="100%" stopColor={liquidEdge} />
        </radialGradient>
      </defs>
      {/* 손잡이 */}
      <path d="M42.5 29c8.5 0 8.5 13 0 13" fill="none" stroke={shellMid} strokeWidth="4.2" strokeLinecap="round" />
      <path d="M42.5 29c8.5 0 8.5 13 0 13" fill="none" stroke={outline} strokeWidth="4.2" strokeLinecap="round" opacity="0.16" />
      <path d="M42.5 30.2c6.4 0 6.4 10.6 0 10.6" fill="none" stroke={shellLight} strokeWidth="1.1" strokeOpacity="0.7" strokeLinecap="round" />
      {/* 몸통 (배럴 형태로 살짝 부풀린 테이퍼) */}
      <path
        d="M12.6 22.5 C10.6 33 13.6 46 17.4 48.8 L36.6 48.8 C40.4 46 43.4 33 41.4 22.5 Z"
        fill={`url(#${bodyId})`}
        stroke={outline}
        strokeWidth="1.1"
      />
      <path d="M17.8 47c2.6 1.6 16.8 1.6 19.4 0" fill="none" stroke={darken(liquid, 0.12)} strokeOpacity="0.18" strokeWidth="1.6" strokeLinecap="round" />
      {/* 입구 테(벽 두께) + 음료 표면 */}
      <ellipse cx="27" cy="22.6" rx="14.6" ry="9.8" fill={shellMid} stroke={outline} strokeWidth="1" />
      <ellipse cx="27" cy="22.2" rx="12.9" ry="8.5" fill={`url(#${liquidId})`} />
      <path d="M16 19.4c4 3.1 18 3.1 22 0" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="21.5" cy="18.8" rx="3.4" ry="1.6" fill="#ffffff" opacity="0.22" />
    </g>
  );
}

function Teacup({ liquid, uid }) {
  const shellLight = lighten(liquid, 0.62);
  const shellMid = lighten(liquid, 0.4);
  const outline = darken(liquid, 0.32);
  const liquidTop = lighten(liquid, 0.14);
  const liquidEdge = darken(liquid, 0.1);
  const bodyId = `${uid}-teacupBody`;
  const liquidId = `${uid}-teacupLiquid`;
  return (
    <g>
      <ellipse cx="27" cy="51.5" rx="18.5" ry="3.2" fill="#20140a" opacity="0.09" />
      <ellipse cx="27" cy="50.4" rx="18.5" ry="3.4" fill="#fdf8ef" stroke="#e3ddcf" strokeWidth="1" />
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shellLight} />
          <stop offset="100%" stopColor={shellMid} />
        </linearGradient>
        <radialGradient id={liquidId} cx="40%" cy="35%" r="68%">
          <stop offset="0%" stopColor={liquidTop} />
          <stop offset="100%" stopColor={liquidEdge} />
        </radialGradient>
      </defs>
      {/* 손잡이 (작고 낮게) */}
      <path d="M43 28.5c6.6 0 6.6 8.6 0 8.6" fill="none" stroke={shellMid} strokeWidth="3.4" strokeLinecap="round" />
      <path d="M43 28.5c6.6 0 6.6 8.6 0 8.6" fill="none" stroke={outline} strokeWidth="3.4" strokeLinecap="round" opacity="0.16" />
      {/* 몸통 (넓고 얕은 형태) */}
      <path
        d="M13.6 22.5 C11.8 31.5 14.4 41 18 43.2 L36 43.2 C39.6 41 42.2 31.5 40.4 22.5 Z"
        fill={`url(#${bodyId})`}
        stroke={outline}
        strokeWidth="1.1"
      />
      {/* 입구 테 + 음료 표면 */}
      <ellipse cx="27" cy="22.6" rx="15.2" ry="9.8" fill={shellMid} stroke={outline} strokeWidth="1" />
      <ellipse cx="27" cy="22.2" rx="13.4" ry="8.5" fill={`url(#${liquidId})`} />
      <path d="M15.4 19.4c4.4 3.1 19 3.1 23.2 0" fill="none" stroke="#ffffff" strokeOpacity="0.32" strokeWidth="1.1" strokeLinecap="round" />
      <ellipse cx="21.5" cy="18.8" rx="3.6" ry="1.6" fill="#ffffff" opacity="0.22" />
    </g>
  );
}

function Glass({ liquid, uid }) {
  const shellLight = lighten(liquid, 0.7);
  const outline = lighten(liquid, 0.1);
  const rimOutline = darken(liquid, 0.15);
  const liquidTop = lighten(liquid, 0.14);
  const liquidEdge = darken(liquid, 0.12);
  const bodyId = `${uid}-glassBody`;
  const liquidId = `${uid}-glassLiquid`;
  return (
    <g>
      <ellipse cx="27" cy="57" rx="12.5" ry="2.4" fill="#20140a" opacity="0.1" />
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shellLight} stopOpacity="0.55" />
          <stop offset="100%" stopColor={liquid} stopOpacity="0.32" />
        </linearGradient>
        <radialGradient id={liquidId} cx="40%" cy="35%" r="68%">
          <stop offset="0%" stopColor={liquidTop} />
          <stop offset="100%" stopColor={liquidEdge} />
        </radialGradient>
      </defs>
      {/* 유리 몸통 (테이퍼진 텀블러) */}
      <path
        d="M14.2 21 C13 34 15.4 51.5 18.4 54.6 L35.6 54.6 C38.6 51.5 41 34 39.8 21 Z"
        fill={`url(#${bodyId})`}
        stroke="#c9d6d2"
        strokeWidth="1.1"
      />
      <line x1="16.6" y1="24" x2="15" y2="46" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.1" strokeLinecap="round" />
      {/* 입구 테 + 음료 표면 (내려다본 각도라 얼음이 표면에 떠 보여요) */}
      <ellipse cx="27" cy="21.2" rx="14" ry="9.2" fill={liquid} fillOpacity="0.22" stroke={rimOutline} strokeWidth="1" />
      <ellipse cx="27" cy="20.8" rx="12.4" ry="8" fill={`url(#${liquidId})`} />
      <g fill="#eef6f5" fillOpacity="0.94" stroke="#c9d6d2" strokeWidth="0.6">
        <rect x="30.5" y="16.5" width="5.6" height="5.6" rx="1.4" transform="rotate(-10 33.3 19.3)" />
        <rect x="24" y="21" width="5" height="5" rx="1.3" transform="rotate(14 26.5 23.5)" />
      </g>
      <g stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.6" strokeLinecap="round">
        <line x1="31.6" y1="17.6" x2="34.2" y2="20.2" />
        <line x1="25" y1="21.9" x2="27.2" y2="24.1" />
      </g>
      {/* 빨대 */}
      <line x1="33" y1="16" x2="41" y2="1" stroke="#e05a5a" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="33" y1="16" x2="41" y2="1" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="0.8" strokeLinecap="round" />
    </g>
  );
}

function Bowl({ liquid, uid }) {
  const shellLight = lighten(liquid, 0.5);
  const scoopTop = lighten(liquid, 0.32);
  const scoopEdge = darken(liquid, 0.08);
  const outline = darken(liquid, 0.3);
  const scoopId = `${uid}-bowlScoop`;
  return (
    <g>
      <ellipse cx="29" cy="57.5" rx="11" ry="2.3" fill="#20140a" opacity="0.09" />
      <rect x="27.3" y="49.5" width="3.4" height="5.5" fill="#e3ddcf" />
      <ellipse cx="29" cy="55.5" rx="9.5" ry="2.2" fill="#efe8d8" />
      {/* 얕고 넓은 접시 (비스듬히 본 입구) */}
      <ellipse cx="29" cy="36" rx="16.5" ry="6.4" fill="#fdf8ef" stroke="#e3ddcf" strokeWidth="1.1" />
      <path
        d="M14.5 36 C14.5 42.5 21 47.5 29 47.5 C37 47.5 43.5 42.5 43.5 36 L40.6 36 C39.6 40.6 34.8 44 29 44 C23.2 44 18.4 40.6 17.4 36 Z"
        fill="#fdf8ef"
        stroke="#e3ddcf"
        strokeWidth="1"
      />
      <defs>
        <radialGradient id={scoopId} cx="36%" cy="30%" r="68%">
          <stop offset="0%" stopColor={scoopTop} />
          <stop offset="100%" stopColor={scoopEdge} />
        </radialGradient>
      </defs>
      {/* 스쿱 (접시 위로 봉긋하게) */}
      <ellipse cx="29" cy="35.5" rx="14.6" ry="5.6" fill={shellLight} opacity="0.5" />
      <circle cx="29" cy="24.5" r="14" fill={`url(#${scoopId})`} stroke={outline} strokeWidth="1" />
      <ellipse cx="23.5" cy="19" rx="4.8" ry="3.2" fill="#ffffff" opacity="0.38" />
      <ellipse cx="23.5" cy="19" rx="2.2" ry="1.4" fill="#ffffff" opacity="0.42" />
    </g>
  );
}

const VESSELS = { mug: Mug, teacup: Teacup, glass: Glass, bowl: Bowl };

// ---------- 메인 컴포넌트 ----------
// categoryId: 카테고리 id, itemId: 항목 id, hasTemp: 온도 토글 여부, temp: "HOT" | "ICE" | null
export function MenuIcon({ categoryId, itemId, hasTemp, temp, size = 32, className = "" }) {
  const conf = ICONS[itemId];
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");
  if (!conf) return null;
  const vessel = resolveVessel(categoryId, hasTemp, temp);
  const Vessel = VESSELS[vessel] || Mug;
  const motifY = vessel === "bowl" ? 23 : vessel === "glass" ? 24 : 23;

  return (
    <svg width={size} height={size} viewBox="0 0 58 64" className={className} aria-hidden="true">
      <Vessel liquid={conf.liquid} uid={uid} />
      <Motif type={conf.motif} color={conf.motifColor} y={motifY} />
    </svg>
  );
}

// ---------- 추가요청 칩용 작은 글리프 ----------
function ExtraGlyph({ type, color }) {
  switch (type) {
    case "ice":
      return (
        <g>
          <rect x="8" y="8" width="16" height="16" rx="2.5" fill={color} fillOpacity="0.55" stroke={color} strokeWidth="1.4" />
          <line x1="8" y1="16" x2="24" y2="16" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
          <line x1="16" y1="8" x2="16" y2="24" stroke="#ffffff" strokeOpacity="0.6" strokeWidth="1" />
        </g>
      );
    case "shot":
      return (
        <g>
          <path d="M11 8 L21 8 L19 24 L13 24 Z" fill={color} fillOpacity="0.85" />
        </g>
      );
    case "jelly":
      return (
        <g fill={color} fillOpacity="0.75">
          <rect x="7" y="11" width="7" height="7" rx="1.5" transform="rotate(-10 10.5 14.5)" />
          <rect x="15" y="14" width="7" height="7" rx="1.5" transform="rotate(12 18.5 17.5)" />
        </g>
      );
    case "syrup":
      return (
        <g>
          <rect x="12" y="6" width="6" height="4" fill={color} />
          <path d="M10 10 L20 10 L18 24 L12 24 Z" fill={color} fillOpacity="0.85" />
        </g>
      );
    case "carton":
      return (
        <g>
          <path d="M9 12 L9 24 L21 24 L21 12 L15 7 Z" fill={color} fillOpacity="0.85" stroke="#c9b98a" strokeWidth="1" />
        </g>
      );
    case "sugar":
      return <rect x="8" y="10" width="14" height="12" rx="2" fill={color} fillOpacity="0.85" />;
    default:
      return null;
  }
}

export function ExtraIcon({ itemId, size = 22, className = "" }) {
  const conf = EXTRA_ICONS[itemId];
  if (!conf) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true">
      <ExtraGlyph type={conf.type} color={conf.color} />
      {conf.accent === "plus" && (
        <g stroke="#3b2b1f" strokeWidth="1.6" strokeLinecap="round">
          <line x1="25" y1="21" x2="30" y2="21" />
          <line x1="27.5" y1="18.5" x2="27.5" y2="23.5" />
        </g>
      )}
      {conf.accent === "minus" && (
        <line x1="25" y1="21" x2="30" y2="21" stroke="#3b2b1f" strokeWidth="1.6" strokeLinecap="round" />
      )}
      {conf.accent === "slash" && (
        <line x1="6" y1="26" x2="26" y2="6" stroke="#b3261e" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}
