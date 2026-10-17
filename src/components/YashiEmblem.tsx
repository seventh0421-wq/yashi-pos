export function YashiEmblem({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="46" stroke="#93B4D7" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
      <circle cx="50" cy="50" r="43" stroke="#688EB5" strokeWidth="1.2" opacity="0.8" />
      
      {/* Crescent Moon */}
      <path
        d="M 50 14 A 36 36 0 1 0 86 50 A 28 28 0 1 1 50 14 Z"
        fill="url(#emblemGrad)"
        opacity="0.9"
      />
      
      {/* Nightflower Botanical Petals in soft pearl cream */}
      <path
        d="M50 32 C54 42 62 48 72 50 C62 52 54 58 50 68 C46 58 38 52 28 50 C38 48 46 42 50 32 Z"
        fill="#FFFFFF"
        stroke="#E2D9C8"
        strokeWidth="0.8"
      />
      
      <circle cx="50" cy="50" r="4.5" fill="#688EB5" />
      <circle cx="50" cy="50" r="2" fill="#FAF8F5" />
      
      {/* Delicate stars */}
      <path d="M 50 20 L 51 24 L 55 25 L 51 26 L 50 30 L 49 26 L 45 25 L 49 24 Z" fill="#688EB5" />
      <path d="M 75 35 L 75.8 37.5 L 78.5 38 L 75.8 38.8 L 75 41 L 74.2 38.8 L 72 38 L 74.2 37.5 Z" fill="#93B4D7" />
      <path d="M 28 65 L 28.8 67 L 31 67.5 L 28.8 68 L 28 70 L 27.2 68 L 25 67.5 L 27.2 67 Z" fill="#93B4D7" />

      <defs>
        <linearGradient id="emblemGrad" x1="14" y1="14" x2="86" y2="86" gradientUnits="userSpaceOnUse">
          <stop stopColor="#93B4D7" />
          <stop offset="0.6" stopColor="#688EB5" />
          <stop offset="1" stopColor="#4A729A" />
        </linearGradient>
      </defs>
    </svg>
  );
}
