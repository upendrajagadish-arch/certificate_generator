interface SolidButtonProps {
  label: string;
  href?: string;
}

export function SolidButton({ label, href = '#' }: SolidButtonProps) {
  return (
    <a
      href={href}
      className="inline-block rounded-lg bg-white px-8 py-3 font-bold text-[#0A0A0A] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#E8E8E8]"
    >
      {label}
    </a>
  );
}
