"use client";
/**
 * Illustrations for the home "needs" banners. Hand-built SVG: crisp at any
 * size, a few KB, and drawn to sit on the banners' coloured gradients (soft
 * white glows, one grounding shadow, no outlines).
 */
import { useId, type ReactNode } from "react";

export type NeedIllustration =
  | "home-repair"
  | "appliances"
  | "fashion"
  | "wedding"
  | "sweets"
  | "travel"
  | "gifts"
  | "shopping";

function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden="true">
      <ellipse cx="100" cy="150" rx="72" ry="7" fill="#000" opacity="0.14" />
      {children}
    </svg>
  );
}

/** A four-point sparkle. */
const Spark = ({ x, y, s = 1, o = 0.9 }: { x: number; y: number; s?: number; o?: number }) => (
  <path
    transform={`translate(${x} ${y}) scale(${s})`}
    d="M0 -7 C1 -2 2 -1 7 0 C2 1 1 2 0 7 C-1 2 -2 1 -7 0 C-2 -1 -1 -2 0 -7Z"
    fill="#fff"
    opacity={o}
  />
);

function HomeRepair({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}roof`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#e11d48" />
        </linearGradient>
        <linearGradient id={`${id}wall`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id={`${id}steel`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e2e8f0" />
          <stop offset="1" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="96" cy="78" r="62" fill="#fff" opacity="0.16" />
      {/* House */}
      <rect x="114" y="38" width="13" height="26" rx="2" fill="#be123c" />
      <rect x="44" y="72" width="88" height="72" rx="6" fill={`url(#${id}wall)`} />
      <path d="M34 78 L88 32 L142 78" fill={`url(#${id}roof)`} stroke={`url(#${id}roof)`} strokeWidth="8" strokeLinejoin="round" />
      <rect x="76" y="104" width="24" height="40" rx="4" fill="#f59e0b" />
      <circle cx="94" cy="125" r="2" fill="#fff" />
      <rect x="52" y="88" width="18" height="16" rx="3" fill="#7dd3fc" />
      <path d="M61 88 V104 M52 96 H70" stroke="#fff" strokeWidth="2" />
      <rect x="106" y="88" width="18" height="16" rx="3" fill="#7dd3fc" />
      <path d="M115 88 V104 M106 96 H124" stroke="#fff" strokeWidth="2" />
      {/* Wrench */}
      <g transform="translate(152 92) rotate(38)">
        <path
          fillRule="evenodd"
          d="M-14 0 A14 14 0 1 1 14 0 A14 14 0 1 1 -14 0Z M-5 -16 H5 V-3 H-5Z"
          fill={`url(#${id}steel)`}
        />
        <rect x="-5.5" y="9" width="11" height="52" rx="5.5" fill={`url(#${id}steel)`} />
        <rect x="-5.5" y="36" width="11" height="25" rx="5.5" fill="#f97316" />
      </g>
      {/* Gear */}
      <g transform="translate(30 116)" fill="#fde68a">
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x="-3" y="-15" width="6" height="8" rx="1.5" transform={`rotate(${i * 45})`} />
        ))}
        <circle r="10" />
        <circle r="4" fill="#f59e0b" />
      </g>
      <Spark x={160} y={40} />
      <Spark x={22} y={60} s={0.7} o={0.7} />
    </Frame>
  );
}

function Appliances({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}body`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dbe4ee" />
        </linearGradient>
        <radialGradient id={`${id}glow`}>
          <stop offset="0" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}fan`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="80" r="62" fill="#fff" opacity="0.16" />
      {/* Fridge */}
      <rect x="34" y="36" width="54" height="108" rx="9" fill={`url(#${id}body)`} />
      <path d="M34 74 H88" stroke="#cbd5e1" strokeWidth="2.5" />
      <rect x="78" y="48" width="4" height="16" rx="2" fill="#94a3b8" />
      <rect x="78" y="84" width="4" height="26" rx="2" fill="#94a3b8" />
      <circle cx="48" cy="52" r="4" fill="#f43f5e" />
      <rect x="54" y="88" width="10" height="8" rx="2" fill="#22c55e" />
      <circle cx="46" cy="100" r="3.5" fill="#f59e0b" />
      {/* Fan */}
      <rect x="138" y="104" width="6" height="34" rx="3" fill="#94a3b8" />
      <ellipse cx="141" cy="140" rx="20" ry="5" fill="#64748b" />
      <circle cx="141" cy="80" r="30" fill="#fff" opacity="0.9" />
      <circle cx="141" cy="80" r="26" fill={`url(#${id}fan)`} />
      {[0, 120, 240].map((r) => (
        <ellipse key={r} cx="141" cy="66" rx="7.5" ry="13" fill="#e0f2fe" stroke="#0369a1" strokeOpacity="0.25" transform={`rotate(${r} 141 80)`} />
      ))}
      <circle cx="141" cy="80" r="5" fill="#0369a1" />
      {/* Bulb */}
      <circle cx="104" cy="34" r="22" fill={`url(#${id}glow)`} />
      <circle cx="104" cy="32" r="11" fill="#fde047" />
      <rect x="99" y="41" width="10" height="7" rx="2" fill="#a3a3a3" />
      <path d="M100 32 q4 -6 8 0" stroke="#fff" strokeWidth="2" fill="none" opacity="0.8" />
      <Spark x={172} y={38} />
      <Spark x={20} y={44} s={0.7} o={0.7} />
    </Frame>
  );
}

function Fashion({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}cloth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#fbcfe8" />
        </linearGradient>
        <linearGradient id={`${id}roll`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <circle cx="96" cy="80" r="62" fill="#fff" opacity="0.16" />
      {/* Hanger */}
      <path d="M96 22 q0 -8 7 -8 q7 0 7 7 q0 6 -8 9 L96 34" stroke="#334155" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M58 52 L96 34 L134 52" stroke="#334155" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {/* Rida */}
      <path d="M66 50 Q96 36 126 50 L150 136 Q96 152 42 136 Z" fill={`url(#${id}cloth)`} />
      <path d="M78 46 Q96 62 114 46" stroke="#f472b6" strokeWidth="3" fill="none" />
      <path d="M46 126 Q96 142 146 126" stroke="#f472b6" strokeWidth="4" fill="none" opacity="0.8" />
      {Array.from({ length: 9 }, (_, i) => (
        <circle key={i} cx={52 + i * 11.5} cy={133 + Math.sin((i / 8) * Math.PI) * 6} r="2.4" fill="#f59e0b" />
      ))}
      {[[78, 82], [104, 96], [84, 110], [112, 70]].map(([x, y]) => (
        <g key={`${x}${y}`} transform={`translate(${x} ${y})`} fill="#f9a8d4">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cy="-4" rx="2.4" ry="4" transform={`rotate(${r})`} />
          ))}
          <circle r="1.8" fill="#f59e0b" />
        </g>
      ))}
      {/* Fabric roll */}
      <g transform="translate(150 108)">
        <rect x="-8" y="-12" width="40" height="30" rx="4" fill={`url(#${id}roll)`} />
        <ellipse cx="-8" cy="3" rx="7" ry="15" fill="#a78bfa" />
        <ellipse cx="-8" cy="3" rx="3" ry="7" fill="#6d28d9" />
        <path d="M4 -12 V18 M16 -12 V18" stroke="#ddd6fe" strokeWidth="2" opacity="0.7" />
      </g>
      <Spark x={30} y={52} />
      <Spark x={168} y={60} s={0.75} o={0.75} />
    </Frame>
  );
}

function Wedding({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="84" r="60" fill="#fff" opacity="0.16" />
      {/* String lights */}
      <path d="M8 24 Q100 74 192 24" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.7" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const x = 8 + 184 * t;
        const y = 24 + 50 * 2 * t * (1 - t) * 1.0 + (1 - t) * 0;
        const c = ["#fde047", "#fb7185", "#fff", "#fdba74"][i % 4];
        return (
          <g key={i}>
            <circle cx={x} cy={y + 5} r="7" fill={c} opacity="0.35" />
            <circle cx={x} cy={y + 5} r="3.6" fill={c} />
          </g>
        );
      })}
      {/* Marigold garland */}
      {Array.from({ length: 11 }, (_, i) => {
        const t = i / 10;
        return <circle key={i} cx={28 + 144 * t} cy={140 - Math.sin(t * Math.PI) * 18} r="6" fill={i % 2 ? "#fb923c" : "#facc15"} />;
      })}
      {/* Rings */}
      <circle cx="84" cy="94" r="24" fill="none" stroke={`url(#${id}gold)`} strokeWidth="7" />
      <circle cx="116" cy="94" r="24" fill="none" stroke={`url(#${id}gold)`} strokeWidth="7" />
      <path d="M116 62 l8 -9 h-16 z" fill="#e0f2fe" />
      <path d="M108 53 h16 l-8 -8 z" fill="#fff" />
      {/* Heart */}
      <path d="M100 128 c-10 -8 -16 -12 -16 -19 a7 7 0 0 1 16 -3 a7 7 0 0 1 16 3 c0 7 -6 11 -16 19z" fill="#f43f5e" />
      <Spark x={150} y={58} />
      <Spark x={48} y={58} s={0.7} o={0.75} />
    </Frame>
  );
}

function Sweets({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}box`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f472b6" />
          <stop offset="1" stopColor="#be185d" />
        </linearGradient>
        <radialGradient id={`${id}laddoo`} cx="0.35" cy="0.35">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#f97316" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="82" r="62" fill="#fff" opacity="0.16" />
      {/* Open lid behind */}
      <path d="M44 74 L70 40 H150 L156 74 Z" fill="#fbcfe8" />
      <path d="M86 40 L82 74 M118 40 L120 74" stroke="#f9a8d4" strokeWidth="3" />
      {/* Laddoos */}
      {[[70, 80], [96, 76], [122, 80], [83, 64], [109, 62]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="15" fill={`url(#${id}laddoo)`} />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={x - 6 + k * 4} cy={y - 3 + (k % 2) * 6} r="1.3" fill="#fff7ed" opacity="0.8" />
          ))}
        </g>
      ))}
      {/* Box */}
      <path d="M38 84 H162 L154 140 H46 Z" fill={`url(#${id}box)`} />
      <rect x="92" y="84" width="16" height="56" fill="#fde047" opacity="0.9" />
      <path d="M58 98 h20 M58 106 h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      {/* Barfi */}
      <g transform="translate(166 124) rotate(-12)">
        <rect x="-14" y="-9" width="28" height="18" rx="3" fill="#fef3c7" />
        <rect x="-14" y="-9" width="28" height="6" rx="3" fill="#bbf7d0" />
        <rect x="-10" y="-11" width="20" height="3" rx="1.5" fill="#e5e7eb" />
      </g>
      <Spark x={32} y={46} />
      <Spark x={172} y={44} s={0.75} o={0.75} />
    </Frame>
  );
}

function Travel({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}gold`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="86" r="60" fill="#fff" opacity="0.16" />
      {/* Crescent and stars */}
      <path d="M44 22 a20 20 0 1 0 22 30 a16 16 0 1 1 -22 -30z" fill="#fde68a" />
      <Spark x={78} y={24} s={0.6} />
      <Spark x={170} y={74} s={0.7} o={0.8} />
      {/* Plane with trail */}
      <path d="M108 40 q24 -14 50 -8" stroke="#fff" strokeWidth="2" strokeDasharray="3 5" fill="none" opacity="0.8" />
      <g transform="translate(166 30) rotate(-14)" fill="#fff">
        <path d="M-14 0 L14 -2 Q20 0 14 2 L-14 0Z" />
        <path d="M0 -1 L-8 -11 H-3 L6 -1Z" />
        <path d="M0 1 L-8 11 H-3 L6 1Z" />
        <path d="M-12 -1 L-16 -6 H-13 L-9 -1Z" />
      </g>
      {/* Kaaba */}
      <path d="M60 74 L104 62 L144 72 L100 84 Z" fill="#374151" />
      <path d="M60 74 L100 84 V142 L60 132 Z" fill="#111827" />
      <path d="M100 84 L144 72 V130 L100 142 Z" fill="#1f2937" />
      <path d="M60 84 L100 94 V102 L60 92 Z" fill={`url(#${id}gold)`} />
      <path d="M100 94 L144 82 V90 L100 102 Z" fill={`url(#${id}gold)`} opacity="0.9" />
      <path d="M112 110 L124 107 V128 L112 131 Z" fill={`url(#${id}gold)`} />
      {/* Prayer mat */}
      <rect x="22" y="128" width="30" height="16" rx="2" fill="#10b981" transform="rotate(-8 37 136)" />
      <rect x="26" y="131" width="22" height="10" rx="1" fill="none" stroke="#fde68a" strokeWidth="1.5" transform="rotate(-8 37 136)" />
    </Frame>
  );
}

function Gifts({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}box`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="82" r="62" fill="#fff" opacity="0.16" />
      <rect x="52" y="76" width="96" height="66" rx="8" fill={`url(#${id}box)`} />
      <rect x="44" y="62" width="112" height="22" rx="6" fill="#8b5cf6" />
      <rect x="92" y="62" width="16" height="80" fill="#fde047" />
      <path d="M100 62 C80 30 58 46 78 60 Z" fill="#facc15" />
      <path d="M100 62 C120 30 142 46 122 60 Z" fill="#facc15" />
      {[[34, 40, "#fb7185"], [166, 50, "#fde047"], [28, 110, "#38bdf8"], [172, 112, "#fb7185"], [150, 30, "#4ade80"]].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width="7" height="4" rx="1" fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      <Spark x={60} y={34} />
    </Frame>
  );
}

function Shopping({ className }: { className?: string }) {
  const id = useId();
  return (
    <Frame className={className}>
      <defs>
        <linearGradient id={`${id}bag`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e2e8f0" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="82" r="62" fill="#fff" opacity="0.16" />
      <path d="M78 58 q0 -26 22 -26 q22 0 22 26" stroke="#334155" strokeWidth="5" fill="none" />
      <path d="M58 56 H142 L150 142 H50 Z" fill={`url(#${id}bag)`} />
      <path d="M126 78 q0 -14 -12 -14" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="70" y="96" width="60" height="10" rx="5" fill="#fbbf24" />
      <rect x="80" y="112" width="40" height="8" rx="4" fill="#fde68a" />
      <Spark x={162} y={46} />
      <Spark x={36} y={60} s={0.7} o={0.75} />
    </Frame>
  );
}

const ART: Record<NeedIllustration, (p: { className?: string }) => ReactNode> = {
  "home-repair": HomeRepair,
  appliances: Appliances,
  fashion: Fashion,
  wedding: Wedding,
  sweets: Sweets,
  travel: Travel,
  gifts: Gifts,
  shopping: Shopping,
};

export function NeedArt({ name, className }: { name: string | null | undefined; className?: string }) {
  const Art = ART[(name as NeedIllustration) in ART ? (name as NeedIllustration) : "shopping"];
  return <Art className={className} />;
}
