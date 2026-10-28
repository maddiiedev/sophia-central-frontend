
import { Link } from 'react-router-dom';

type BrandLogoProps = {
  variant?: 'full' | 'compact';
  linked?: boolean;
  className?: string;
  tone?: 'light' | 'dark';
};

export function BrandLogo({
  variant = 'full',
  linked = true,
  className = '',
  tone = 'dark',
}: BrandLogoProps) {
  const logoSrc =
    variant === 'full'
      ? '/sophia-central-logo.png'
      : '/sophia-central-mark.png';

  const logo = (
    <img
      src={logoSrc}
      alt="Sophis Central"
      className={
        variant === 'full'
          ? 'block h-auto max-h-14 w-auto max-w-full object-contain'
          : 'block h-10 w-10 shrink-0 object-contain'
      }
    />
  );

  const content = (
    <div
      className={`inline-flex items-center ${className}`}
      data-logo-tone={tone}
    >
      {logo}
    </div>
  );

  if (linked) {
    return (
      <Link
        to="/"
        aria-label="Sophis Central home"
        className="inline-flex max-w-full"
      >
        {content}
      </Link>
    );
  }

  return content;
}