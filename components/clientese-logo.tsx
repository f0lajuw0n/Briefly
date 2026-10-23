import type { SVGProps } from "react";

type ClienteseLogoProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

/**
 * CLIENTESE mark: an open C built from a precise, forward-stepping route.
 * It suggests raw client feedback being gathered, clarified, and moved into action.
 */
export function ClienteseLogo({ title = "CLIENTESE", ...props }: ClienteseLogoProps) {
  return (
    <svg viewBox="0 0 40 40" role="img" aria-label={title} {...props}>
      <path
        d="M5 5h22v7H12v16h15v7H5V5Z"
        fill="currentColor"
      />
      <path d="M28 12h7v7h-7zM21 19h7v7h-7zM28 26h7v7h-7z" fill="currentColor" />
    </svg>
  );
}
