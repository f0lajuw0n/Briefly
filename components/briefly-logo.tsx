import type { SVGProps } from "react";

type BrieflyLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

export function BrieflyLogo({ title = "Briefly", ...props }: BrieflyLogoProps) {
  return (
    <svg viewBox="0 0 36 36" role="img" aria-label={title} {...props}>
      <rect width="36" height="36" rx="10" fill="currentColor" />
      <path
        d="M10.5 9.75h7.8a4.35 4.35 0 0 1 0 8.7h-7.8v-8.7Zm0 8.7h8.9a4.9 4.9 0 0 1 0 9.8h-8.9v-9.8Z"
        fill="none"
        stroke="white"
        strokeWidth="2.35"
        strokeLinejoin="round"
      />
      <circle cx="27.6" cy="8.4" r="2.15" fill="#dcf66b" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
