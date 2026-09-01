interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'orange' | 'white' | 'gray';
}

export function Spinner({ size = 'md', color = 'orange' }: SpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };
  const colors = {
    orange: 'border-[#F97316] border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent',
  };
  return (
    <span
      className={`inline-block rounded-full border-2 animate-spin ${sizes[size]} ${colors[color]}`}
      role="status"
      aria-label="Loading"
    />
  );
}
