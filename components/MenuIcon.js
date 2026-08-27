import { ICONS, EXTRA_ICONS, resolveVessel } from "@/lib/menuIcons";

// ---------- 토핑 모티프 ----------
function Motif({ type, color, x = 29, y = 26 }) {
  switch (type) {
    case "bean":
      return (
        <g fill={color}>
          <ellipse cx={x - 4} cy={y} rx="3.2" ry="5" transform={`rotate(-20 ${x - 4} ${y})`} />
          <ellipse cx={x + 4} cy={y} rx="3.2" ry="5" transform={`rotate(20 ${x + 4} ${y})`} />
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
        <g fill={color}>
          <ellipse cx={x - 3} cy={y} rx="3" ry="4" />
          <ellipse cx={x + 3} cy={y + 1} rx="3" ry="4" />
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
          <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="#ffffff" strokeOpacity="0.4" strokeWidth="0.8" />
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
          <line x1={x} y1={y - 6} x2={x} y2={y - 9} stroke="#4f7942" strokeWidth="1.2" />
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
          <path d={`M ${x - 6} ${y} A6 6 0 0 1 ${x + 6} ${y} Z`} fill={color} fillOpacity="0.9" />
          <g stroke="#ffffff" strokeOpacity="0.6" strokeWidth="0.6">
            <line x1={x} y1={y} x2={x} y2={y - 5} />
            <line x1={x} y1={y} x2={x - 4} y2={y - 3} />
            <line x1={x} y1={y} x2={x + 4} y2={y - 3} />
          </g>
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
          <path d={`M ${x} ${y - 6} l2 -3 l2 3 z`} fill="#4f7942" />
        </g>
      );
    case "grape":
      return (
        <g fill={color}>
          <circle cx={x - 3} cy={y - 2} r="2.4" />
          <circle cx={x + 3} cy={y - 2} r="2.4" />
          <circle cx={x - 1.5} cy={y + 2} r="2.4" />
          <circle cx={x + 1.5} cy={y + 2} r="2.4" />
          <circle cx={x} cy={y + 5.5} r="2.4" />
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
function Mug({ liquid }) {
  return (
    <g>
      <path d="M46 30c10 0 10 14 0 14" stroke="#3b2b1f" strokeWidth="3" fill="none" />
      <rect x="14" y="24" width="30" height="24" rx="4" fill={liquid} stroke="#2c2018" strokeWidth="1.2" />
      <ellipse cx="29" cy="24" rx="15" ry="3" fill="#ffffff" fillOpacity="0.18" />
      <g stroke="#e8cf94" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M23 18c-3 -4 3 -6 0 -11" />
        <path d="M35 18c-3 -4 3 -6 0 -11" />
      </g>
    </g>
  );
}

function Teacup({ liquid }) {
  return (
    <g>
      <ellipse cx="29" cy="50" rx="20" ry="4" fill="#fff8ee" stroke="#d8d0c0" strokeWidth="1" />
      <path d="M46 34c7 0 7 10 0 10" stroke="#3b2b1f" strokeWidth="2.4" fill="none" />
      <path d="M16 30 L42 30 L38 46 L20 46 Z" fill={liquid} stroke="#2c2018" strokeWidth="1.2" />
      <ellipse cx="29" cy="30" rx="13" ry="2.4" fill="#ffffff" fillOpacity="0.18" />
      <g stroke="#e8cf94" strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8">
        <path d="M23 24c-3 -4 3 -6 0 -11" />
        <path d="M35 24c-3 -4 3 -6 0 -11" />
      </g>
    </g>
  );
}

function Glass({ liquid }) {
  return (
    <g>
      <path
        d="M16 16 L42 16 L38 54 L20 54 Z"
        fill={liquid}
        fillOpacity="0.92"
        stroke="#9fb0ac"
        strokeWidth="1.2"
      />
      <line x1="38" y1="10" x2="30" y2="24" stroke="#e05a5a" strokeWidth="2.6" strokeLinecap="round" />
      <g fill="#ffffff" fillOpacity="0.85" stroke="#cfd8dc" strokeWidth="0.6">
        <rect x="21" y="20" width="6" height="6" rx="1.2" transform="rotate(-12 24 23)" />
        <rect x="29" y="26" width="5.5" height="5.5" rx="1.2" transform="rotate(10 32 29)" />
      </g>
      <g fill="#ffffff" fillOpacity="0.25">
        <circle cx="18.5" cy="40" r="1" />
        <circle cx="21" cy="46" r="1" />
        <circle cx="37" cy="42" r="1" />
      </g>
    </g>
  );
}

function Bowl({ liquid }) {
  return (
    <g>
      <rect x="27" y="52" width="4" height="4" fill="#d8d0c0" />
      <ellipse cx="29" cy="57" rx="9" ry="2.4" fill="#e3ddcf" />
      <path
        d="M18 34 L40 34 L35 50 L23 50 Z"
        fill="#fdf8ef"
        stroke="#d8d0c0"
        strokeWidth="1.2"
      />
      <circle cx="29" cy="26" r="13" fill={liquid} stroke="#2c2018" strokeWidth="1" />
      <ellipse cx="24" cy="21" rx="4.5" ry="3" fill="#ffffff" fillOpacity="0.25" />
    </g>
  );
}

const VESSELS = { mug: Mug, teacup: Teacup, glass: Glass, bowl: Bowl };

// ---------- 메인 컴포넌트 ----------
// categoryId: 카테고리 id, itemId: 항목 id, hasTemp: 온도 토글 여부, temp: "HOT" | "ICE" | null
export function MenuIcon({ categoryId, itemId, hasTemp, temp, size = 32, className = "" }) {
  const conf = ICONS[itemId];
  if (!conf) return null;
  const vessel = resolveVessel(categoryId, hasTemp, temp);
  const Vessel = VESSELS[vessel] || Mug;
  const motifY = vessel === "bowl" ? 24 : vessel === "glass" ? 24 : 27;

  return (
    <svg width={size} height={size} viewBox="0 0 58 64" className={className} aria-hidden="true">
      <Vessel liquid={conf.liquid} />
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
