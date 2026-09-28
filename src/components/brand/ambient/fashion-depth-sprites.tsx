import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

export type DepthFashionId =
  | "heel"
  | "pump"
  | "flat"
  | "sandal"
  | "loafer"
  | "handbag"
  | "sneaker"
  | "boot";

type SpriteProps = { className?: string; uid?: string };

function Defs({ uid }: { uid: string }) {
  return (
    <defs>
      <linearGradient id={`${uid}-g1`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6FB0B0" stopOpacity="0.55" />
        <stop offset="55%" stopColor="#5F4F92" stopOpacity="0.65" />
        <stop offset="100%" stopColor="#1F5AA6" stopOpacity="0.5" />
      </linearGradient>
      <linearGradient id={`${uid}-g2`} x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E3B233" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#CC2027" stopOpacity="0.25" />
      </linearGradient>
      <filter id={`${uid}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#1A1A1A" floodOpacity="0.18" />
      </filter>
    </defs>
  );
}

function DepthHeel({ className, uid = "heel" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 200 240" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M36 148c10-28 38-48 72-52 14-2 28 0 40 8 10 6 16 18 16 32v36H36v-24z" opacity="0.92" />
        <path fill={`url(#${uid}-g2)`} d="M118 108c4 16 6 34 4 52" opacity="0.75" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1.2" strokeOpacity="0.35" d="M32 148h86M44 118c18-24 42-38 66-40" />
        <path fill="#1A1A1A" fillOpacity="0.2" d="M124 152h8v42h-8z" />
        <ellipse cx="128" cy="198" rx="16" ry="5" fill="#5F4F92" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

function DepthPump({ className, uid = "pump" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 200 220" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M34 132c12-26 40-44 70-46 18-1 34 6 46 18 8 8 12 20 12 34v32H34v-38z" />
        <path fill={`url(#${uid}-g2)`} opacity="0.6" d="M112 118h12v62h-12z" />
        <rect x="112" y="178" width="20" height="10" rx="3" fill="#1F5AA6" fillOpacity="0.45" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1.1" strokeOpacity="0.3" d="M42 108c22-8 48-8 64 0" />
      </g>
    </svg>
  );
}

function DepthFlat({ className, uid = "flat" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 220 140" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M28 72c8-24 36-42 68-42s60 18 68 42v28H28V72z" />
        <path fill={`url(#${uid}-g2)`} d="M32 88h156v16H32z" opacity="0.5" />
        <ellipse cx="110" cy="104" rx="62" ry="8" fill="#6FB0B0" fillOpacity="0.35" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1" strokeOpacity="0.28" d="M40 68c24-8 52-8 76 0" />
      </g>
    </svg>
  );
}

function DepthHandbag({ className, uid = "bag" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 160 190" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M34 68h92c10 0 18 8 18 18v72c0 10-8 18-18 18H34c-10 0-18-8-18-18V86c0-10 8-18 18-18z" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1.2" strokeOpacity="0.32" d="M48 68c0-16 10-28 24-32 8-2 18-2 26 0 14 4 24 16 24 32" />
        <path fill={`url(#${uid}-g2)`} opacity="0.45" d="M38 92h84v8H38z" />
        <path fill="#5F4F92" fillOpacity="0.25" d="M78 68v110" strokeWidth="1" />
      </g>
    </svg>
  );
}

function DepthBoot({ className, uid = "boot" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 140 230" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M42 52v108c0 10 8 18 18 18h28V52H42z" />
        <path fill={`url(#${uid}-g2)`} d="M38 178h76c12 0 20-8 20-18V56H38v122z" opacity="0.85" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1" strokeOpacity="0.3" d="M48 86h32M48 108h32M48 130h32" />
      </g>
    </svg>
  );
}

function DepthLoafer({ className, uid = "loafer" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 210 130" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M24 74c12-26 42-44 78-44 22 0 42 10 54 26v34H24V74z" />
        <path fill={`url(#${uid}-g2)`} d="M58 58c28-12 56-10 78 4" opacity="0.55" />
        <ellipse cx="104" cy="66" rx="10" ry="6" fill="#E3B233" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

function DepthSandal({ className, uid = "sandal" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 180 150" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M22 96c14-10 40-14 66-12 32 2 54 12 64 26v12H22V96z" />
        <path fill="none" stroke="#1F5AA6" strokeWidth="2" strokeOpacity="0.45" d="M58 52v44M122 48v48" />
        <path fill={`url(#${uid}-g2)`} d="M58 52c20-10 44-10 64 0" opacity="0.5" />
      </g>
    </svg>
  );
}

function DepthSneaker({ className, uid = "sneaker" }: SpriteProps) {
  return (
    <svg className={cn("mjms-depth-sprite", className)} viewBox="0 0 220 130" aria-hidden>
      <Defs uid={uid} />
      <g filter={`url(#${uid}-shadow)`}>
        <path fill={`url(#${uid}-g1)`} d="M20 68c10-22 38-38 68-38 14 0 28 6 38 16l10 18v28H20V68z" />
        <path fill={`url(#${uid}-g2)`} d="M78 32l14-18h32l12 18" opacity="0.65" />
        <path fill="none" stroke="#1A1A1A" strokeWidth="1" strokeOpacity="0.25" d="M36 78h148" />
      </g>
    </svg>
  );
}

const BY_ID: Record<DepthFashionId, (p: SpriteProps) => ReactElement> = {
  heel: DepthHeel,
  pump: DepthPump,
  flat: DepthFlat,
  sandal: DepthSandal,
  loafer: DepthLoafer,
  handbag: DepthHandbag,
  sneaker: DepthSneaker,
  boot: DepthBoot,
};

export function DepthFashionSprite({
  id,
  className,
  uid,
}: {
  id: DepthFashionId;
  className?: string;
  uid?: string;
}) {
  const C = BY_ID[id];
  return <C className={className} uid={uid ?? id} />;
}
