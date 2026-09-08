/**
 * A technician mid-job, drawn flat in the platform palette. Illustration
 * rather than a stock gradient: the subject of this product is hands-on work.
 */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 220"
      className={className}
      role="img"
      aria-label="A technician servicing a wall-mounted air conditioner"
    >
      {/* wall + floor */}
      <rect width="320" height="220" fill="#1D4B4A" />
      <rect y="176" width="320" height="44" fill="#143634" />
      <g stroke="#2E6A68" strokeWidth="1">
        <path d="M0 40h320M0 88h320M0 136h320" opacity=".45" />
      </g>

      {/* AC unit on the wall */}
      <g>
        <rect x="176" y="44" width="112" height="40" rx="7" fill="#F2F1EC" />
        <rect x="176" y="72" width="112" height="12" rx="6" fill="#DEDCD3" />
        <rect x="186" y="54" width="60" height="4" rx="2" fill="#DEDCD3" />
        <circle cx="276" cy="58" r="3" fill="#3F7A54" />
        {/* cool air */}
        <g stroke="#D98C2B" strokeWidth="3" strokeLinecap="round" opacity=".85">
          <path d="M196 96c6 6 6 12 0 18" />
          <path d="M216 96c6 7 6 14 0 21" />
          <path d="M236 96c6 6 6 12 0 18" />
        </g>
      </g>

      {/* ladder */}
      <g stroke="#8B857A" strokeWidth="5" strokeLinecap="round">
        <path d="M96 176 116 92M132 176 124 92" />
      </g>
      <g stroke="#8B857A" strokeWidth="4" strokeLinecap="round">
        <path d="M104 152h24M110 128h20M114 108h14" />
      </g>

      {/* technician */}
      <g>
        {/* legs */}
        <path d="M140 176v-26l14-10 8 10-10 12v14z" fill="#143634" />
        <path d="M126 176v-30l16-6 6 12-12 8v16z" fill="#1C1A17" />
        {/* body */}
        <path d="M126 146c-6-18-4-34 4-44l26-8c10 6 14 20 12 34l-10 22z" fill="#D98C2B" />
        {/* arm reaching to the unit */}
        <path
          d="M152 106c14-6 26-12 34-20"
          stroke="#D98C2B"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="190" cy="84" r="7" fill="#F2F1EC" />
        {/* head + cap */}
        <circle cx="146" cy="82" r="15" fill="#F2F1EC" />
        <path d="M131 78a15 15 0 0 1 30 0z" fill="#B8452F" />
        <path d="M158 78h12a3 3 0 0 1 0 6h-12z" fill="#B8452F" />
        {/* toolbelt */}
        <rect x="124" y="134" width="34" height="9" rx="3" fill="#1C1A17" />
        <rect x="146" y="140" width="9" height="14" rx="2" fill="#3F7A54" />
      </g>

      {/* toolbox on the floor */}
      <g>
        <rect x="40" y="152" width="46" height="26" rx="4" fill="#B8452F" />
        <rect x="40" y="160" width="46" height="6" fill="#8f3524" />
        <path d="M55 152v-6h16v6" stroke="#1C1A17" strokeWidth="3" fill="none" strokeLinecap="round" />
      </g>
    </svg>
  );
}
