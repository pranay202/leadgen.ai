export const BRAND = {
  name: 'Leadgen.ai',
  mark: 'L',
} as const;

type BrandProps = {
  variant?: 'light' | 'dark';
  compact?: boolean;
};

export function Brand({ variant = 'dark', compact = false }: BrandProps) {
  const isLight = variant === 'light';

  return (
    <span
      className={`inline-flex items-center gap-2 ${
        compact ? 'text-xl' : 'text-lg'
      } font-bold tracking-tight ${isLight ? 'text-white' : 'text-slate-900'}`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-lg ${
          compact ? 'h-8 w-8' : 'h-7 w-7'
        } ${
          isLight
            ? 'bg-cyan-400 text-slate-950'
            : 'bg-slate-900 text-sm text-cyan-300'
        }`}
      >
        {BRAND.mark}
      </span>
      {BRAND.name}
    </span>
  );
}
