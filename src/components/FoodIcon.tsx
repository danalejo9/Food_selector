import type { ReactNode } from 'react'

/**
 * Set propio de iconos de ingredientes: trazo de tinta + relleno de color,
 * como dibujados en una libreta. Si la clave no existe se usa como emoji.
 */
const I: Record<string, ReactNode> = {
  egg: (
    <>
      <path d="M16 4c-5 0-9 8-9 14a9 9 0 0 0 18 0c0-6-4-14-9-14Z" fill="#F6E7CF" />
      <path d="M12 12c1-2 2-3 3-3.5" />
    </>
  ),
  milk: (
    <>
      <path d="M10 11 12 6h8l2 5v17H10Z" fill="#FFFFFF" />
      <path d="M12 6V3h8v3M10 11h12" />
      <path d="M10 17h12v6H10z" fill="#9CC3E6" />
    </>
  ),
  cheese: (
    <>
      <path d="M4 20 22 9l6 5v10H4Z" fill="#F4C85B" />
      <path d="M4 20h24" />
      <circle cx="11" cy="23.5" r="1.4" />
      <circle cx="21" cy="17" r="1.6" />
    </>
  ),
  butter: (
    <>
      <path d="M5 16 12 11h15v8l-7 5H5Z" fill="#F9E6A0" />
      <path d="M5 16h15l7-5M20 16v8" />
    </>
  ),
  cream: (
    <>
      <path d="M9 9h14l-1 19H10Z" fill="#FFFFFF" />
      <path d="M9 9c0-3 3-5 7-5s7 2 7 5" fill="#FBF3E4" />
      <path d="M11 16h10" />
    </>
  ),
  yogurt: (
    <>
      <path d="M7 10h18l-2.5 18h-13Z" fill="#F7D6DE" />
      <path d="M6 7h20v3H6z" fill="#FFFFFF" />
      <path d="M11 19h10" />
    </>
  ),
  berries: (
    <>
      <circle cx="11" cy="19" r="6" fill="#4F5FA8" />
      <circle cx="21" cy="21" r="5.5" fill="#6071BE" />
      <circle cx="17" cy="11" r="5" fill="#3E4C91" />
      <path d="M10 17.5l1 1.5 1-1.5M20 19.5l1 1.5 1-1.5M16 9.5l1 1.5 1-1.5" />
    </>
  ),
  banana: (
    <>
      <path d="M5 11c2 9 10 15 21 11-1 4-6 6-11 5C9 26 4 19 5 11Z" fill="#F5D34E" />
      <path d="M5 11 4 8M26 22l2-1" />
    </>
  ),
  strawberry: (
    <>
      <path d="M16 28C9 23 6 17 7 13c1-3 5-4 9-4s8 1 9 4c1 4-2 10-9 15Z" fill="#D9453A" />
      <path d="M10 9c2 1 4 1 6 0 2 1 4 1 6 0l-2-3-4 2-4-2Z" fill="#6E9B4E" />
      <path d="M12 15v.5M20 15v.5M16 19v.5M13 22v.5M19 22v.5" />
    </>
  ),
  lemon: (
    <>
      <path d="M5 17c0-6 5-10 11-10s11 4 11 10-5 9-11 9S5 23 5 17Z" fill="#F3DC4B" />
      <path d="M5 17H3M27 17h2" />
      <path d="M16 7c1-2 3-3 5-3" />
    </>
  ),
  avocado: (
    <>
      <path d="M16 3c-5 0-6 9-9 14a9 9 0 0 0 18 0c-3-5-4-14-9-14Z" fill="#6E8F3A" />
      <path d="M16 7c-3 0-4 6-6 10a6 6 0 0 0 12 0c-2-4-3-10-6-10Z" fill="#D8E39A" />
      <circle cx="16" cy="19" r="3.2" fill="#8B5A33" />
    </>
  ),
  apple: (
    <>
      <path d="M16 10c-3-2-10-2-10 7 0 6 4 11 7 11 1.5 0 2-1 3-1s1.5 1 3 1c3 0 7-5 7-11 0-9-7-9-10-7Z" fill="#D9453A" />
      <path d="M16 10c0-3 1-5 3-6" />
      <path d="M17 7c2-2 5-2 6-1-1 2-4 3-6 1Z" fill="#6E9B4E" />
    </>
  ),
  tomato: (
    <>
      <path d="M4 17c0-6 5-9 12-9s12 3 12 9-5 11-12 11S4 23 4 17Z" fill="#E0503C" />
      <path d="M10 9l3 2 3-4 3 4 3-2-2 4h-8Z" fill="#6E9B4E" />
    </>
  ),
  onion: (
    <>
      <path d="M16 6c-2 4-11 7-11 14a11 8 0 0 0 22 0c0-7-9-10-11-14Z" fill="#E8C7A2" />
      <path d="M16 6V3M16 13c-3 3-5 6-5 10M16 13c3 3 5 6 5 10" />
    </>
  ),
  scallion: (
    <>
      <path d="M13 29c-2-3-2-7 0-9h6c2 2 2 6 0 9Z" fill="#FBF3E4" />
      <path d="M13 20c-1-6-5-11-7-16M16 20V3M19 20c1-6 5-11 7-16" stroke="#4E7A34" />
      <path d="M14 29l-1 2M16 29v2M18 29l1 2" />
    </>
  ),
  garlic: (
    <>
      <path d="M16 5c-2 4-10 7-10 14 0 5 4 8 10 8s10-3 10-8c0-7-8-10-10-14Z" fill="#F4EEE3" />
      <path d="M16 5V2M16 12v15M11 15c-1 3-1 8 1 12M21 15c1 3 1 8-1 12" />
    </>
  ),
  potato: (
    <>
      <path d="M6 13c2-5 10-7 16-5s6 8 4 13-9 7-15 5-7-8-5-13Z" fill="#C9A06A" />
      <path d="M12 13v.5M19 12v.5M16 19v.5M21 19v.5M10 20v.5" />
    </>
  ),
  carrot: (
    <>
      <path d="M22 10 5 27c-1 1 0 2 1 1l17-12c2-2 1-5-1-6Z" fill="#E9812F" />
      <path d="M22 10c0-3 1-6 3-7M23 11c2-1 5-1 7 0M23 10c1-2 4-4 6-4" stroke="#4E7A34" />
      <path d="M12 21l2 2M16 17l2 1.5" />
    </>
  ),
  pepper: (
    <>
      <path d="M9 11c-3 1-4 5-3 10 1 4 3 7 6 7 1.5 0 2.5-1 4-1s2.5 1 4 1c3 0 5-3 6-7 1-5 0-9-3-10-3-1-4 1-7 1s-4-2-7-1Z" fill="#D9453A" />
      <path d="M16 12c0-3 1-6 4-8" stroke="#4E7A34" />
      <path d="M16 12v14" />
    </>
  ),
  herb: (
    <>
      <path d="M16 29V12M16 18l-6-4M16 22l6-5M16 14l5-5" />
      <path d="M10 14c-4 0-6-3-5-5 3 0 5 2 5 5ZM22 17c4 0 6-3 5-5-3 0-5 2-5 5ZM21 9c1-4 4-5 6-4-1 3-3 4-6 4ZM16 12c-3-2-3-6-1-8 2 2 2 6 1 8Z" fill="#6E9B4E" />
    </>
  ),
  leaf: (
    <>
      <path d="M6 26C5 15 12 5 27 5c0 14-8 22-21 21Z" fill="#5E8A42" />
      <path d="M6 26 20 12M11 21h6M14 17l1-5" />
    </>
  ),
  corn: (
    <>
      <path d="M16 4c-4 0-6 6-6 12s2 10 6 10 6-4 6-10-2-12-6-12Z" fill="#F2CB45" />
      <path d="M12 10h8M11 15h10M11 20h10M16 5v20" />
      <path d="M10 16c-4 3-5 8-3 13 3-1 6-3 9-3M22 16c4 3 5 8 3 13-3-1-6-3-9-3" fill="#8DB25F" />
    </>
  ),
  chicken: (
    <>
      <path d="M20 5c5 0 8 4 7 9-1 4-5 6-9 6l-5 5-3-3 5-5c-1-5 0-12 5-12Z" fill="#D89A5B" />
      <path d="M10 22 6 26M8 28a2.5 2.5 0 1 1-4-4M10 22l-2 6" fill="#FBF3E4" />
    </>
  ),
  meat: (
    <>
      <path d="M5 16c0-6 6-10 13-10s9 5 9 10-4 10-11 10S5 22 5 16Z" fill="#C24A45" />
      <path d="M10 14c3-3 8-4 12-2M9 19c4 2 9 2 13-1" stroke="#F4D7CF" />
    </>
  ),
  bacon: (
    <>
      <path d="M4 10c4-3 6 3 10 0s6 3 10 0 4 0 4 0v6c-4 3-6-3-10 0s-6-3-10 0-4 0-4 0Z" fill="#C8574B" />
      <path d="M4 18c4-3 6 3 10 0s6 3 10 0 4 0 4 0v6c-4 3-6-3-10 0s-6-3-10 0-4 0-4 0Z" fill="#C8574B" />
      <path d="M6 13c3-1 5 2 8 0M16 21c3-1 5 2 8 0" stroke="#F4D7CF" />
    </>
  ),
  can: (
    <>
      <path d="M6 12v12c0 2 4 4 10 4s10-2 10-4V12" fill="#B8C4CC" />
      <ellipse cx="16" cy="12" rx="10" ry="4" fill="#DDE3E7" />
      <path d="M6 16c0 2 4 4 10 4s10-2 10-4v5c0 2-4 4-10 4S6 23 6 21Z" fill="#3E6E9C" />
    </>
  ),
  beans: (
    <>
      <path d="M5 14c0-4 4-6 7-4 2 1 3 0 4-1 3-2 6 1 5 4-1 4-6 6-10 6-3 0-6-1-6-5Z" fill="#7A3B2E" />
      <path d="M12 21c0-3 3-5 6-3 2 1 3 0 4-1 3-1 5 2 4 4-1 4-5 6-9 6-3 0-5-2-5-6Z" fill="#8E4535" />
    </>
  ),
  flour: (
    <>
      <path d="M8 9 10 5h12l2 4v18c0 1-1 2-2 2H10c-1 0-2-1-2-2Z" fill="#F7F1E6" />
      <path d="M8 9h16M12 17c1-2 3-3 4-3s3 1 4 3c-1 3-3 4-4 4s-3-1-4-4Z" />
      <path d="M16 14v7" />
    </>
  ),
  rice: (
    <>
      <path d="M4 16h24c0 7-5 12-12 12S4 23 4 16Z" fill="#E7D7BE" />
      <path d="M6 16c0-4 4-7 10-7s10 3 10 7" fill="#FFFFFF" />
      <path d="M10 12v1M14 11v1M18 12v1M22 13v1M12 14v.5M20 14v.5" />
    </>
  ),
  pasta: (
    <>
      <path d="M6 22c3-6 3-12 1-17M11 24c2-7 2-13 0-19M16 25c1-7 1-14 0-20M21 24c-1-7-1-13 1-19M26 22c-3-6-3-12-1-17" stroke="#C99A3A" />
      <path d="M6 22c3 3 17 3 20 0" />
      <path d="M5 26h22" />
    </>
  ),
  oats: (
    <>
      <path d="M4 17h24c0 6-5 10-12 10S4 23 4 17Z" fill="#EFE2CA" />
      <ellipse cx="11" cy="14" rx="3" ry="2" fill="#D9BF8C" />
      <ellipse cx="17" cy="12" rx="3" ry="2" fill="#D9BF8C" />
      <ellipse cx="22" cy="15" rx="3" ry="2" fill="#D9BF8C" />
      <ellipse cx="15" cy="16" rx="3" ry="2" fill="#D9BF8C" />
    </>
  ),
  bread: (
    <>
      <path d="M4 20c0-7 6-11 12-11s12 4 12 11c0 4-2 6-4 6H8c-2 0-4-2-4-6Z" fill="#D6964E" />
      <path d="M11 13l2 4M16 12l1 5M21 13l-1 4" />
    </>
  ),
  arepa: (
    <>
      <ellipse cx="16" cy="18" rx="12" ry="8" fill="#F1D48C" />
      <ellipse cx="16" cy="16" rx="12" ry="7" fill="#F6E0A6" />
      <path d="M10 15l1 .5M18 13l1 .5M21 18l1 .5M13 19l1 .5" stroke="#B5813A" />
    </>
  ),
  salt: (
    <>
      <path d="M10 13c0-5 3-8 6-8s6 3 6 8v13c0 1-1 2-2 2h-8c-1 0-2-1-2-2Z" fill="#FFFFFF" />
      <path d="M10 13h12" />
      <path d="M14 9v.5M18 9v.5M16 7v.5" />
    </>
  ),
  oil: (
    <>
      <path d="M13 4h6v4l3 5v14c0 1-1 2-2 2h-8c-1 0-2-1-2-2V13l3-5Z" fill="#E8C75A" />
      <path d="M13 8h6M10 16h12" />
    </>
  ),
  sugar: (
    <>
      <path d="M6 12 16 6l10 6v10l-10 6-10-6Z" fill="#FFFFFF" />
      <path d="M6 12l10 6 10-6M16 18v10" />
    </>
  ),
  water: (
    <>
      <path d="M16 4c-4 6-8 11-8 16a8 8 0 0 0 16 0c0-5-4-10-8-16Z" fill="#9CC3E6" />
      <path d="M12 20c0 2 1 4 3 4" />
    </>
  ),
  spice: (
    <>
      <path d="M11 11h10v16c0 1-1 2-2 2h-6c-1 0-2-1-2-2Z" fill="#B55A3A" />
      <path d="M10 6h12v5H10z" fill="#3B3530" />
      <path d="M11 17h10" stroke="#FBF3E4" />
    </>
  ),
  jar: (
    <>
      <path d="M8 10h16v16c0 2-1 3-3 3H11c-2 0-3-1-3-3Z" fill="#F4EEE3" />
      <path d="M9 5h14v5H9z" fill="#C8412B" />
      <path d="M12 16h8v6h-8z" />
    </>
  ),
  honey: (
    <>
      <path d="M7 12h18v13c0 2-2 4-4 4H11c-2 0-4-2-4-4Z" fill="#E6A83A" />
      <path d="M8 7h16v5H8z" fill="#F4EEE3" />
      <path d="M12 12v4c0 1 1 1 1 0M19 12v6c0 1 1 1 1 0" />
    </>
  ),
  cinnamon: (
    <>
      <path d="M5 21 21 5l6 6-16 16Z" fill="#A45B2E" />
      <path d="M8 24 24 8" />
      <ellipse cx="24" cy="8" rx="2" ry="4" transform="rotate(45 24 8)" fill="#C57A45" />
    </>
  ),
  chocolate: (
    <>
      <path d="M6 7h20v19H6z" fill="#5B3326" />
      <path d="M6 13.5h20M6 19.5h20M12.5 7v19M19.5 7v19" stroke="#8A5A45" />
      <path d="M6 7h20v19H6z" />
    </>
  ),
}

export const ICON_KEYS = Object.keys(I)

export function FoodIcon({ icon, size = 32, title }: { icon?: string; size?: number; title?: string }) {
  const node = icon ? I[icon] : undefined
  if (!node) {
    return (
      <span className="food-emoji" style={{ fontSize: size * 0.8, width: size, height: size }} role="img" aria-label={title}>
        {icon || '•'}
      </span>
    )
  }
  return (
    <svg
      className="food-icon"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
    >
      {node}
    </svg>
  )
}
