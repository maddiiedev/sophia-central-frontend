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
          ? 'block h-10 w-auto max-w-full object-contain sm:h-12 lg:h-14'
          : 'block h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10'
      }
      decoding="async"
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
