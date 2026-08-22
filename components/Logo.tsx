import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="Korvesta home" className="relative block h-[30px] w-[104px] shrink-0 overflow-hidden rounded-sm">
      <Image src="/images/logo-dark-source.png" alt="Korvesta" width={104} height={42} priority className="absolute inset-0 h-full w-full object-cover dark-logo" />
      <Image src="/images/logo-light-source.png" alt="Korvesta" width={104} height={42} priority className="absolute inset-0 h-full w-full object-cover light-logo" />
    </Link>
  );
}
