import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" aria-label="Korvesta home" className="relative block h-[38px] w-[132px] shrink-0 overflow-hidden rounded-sm">
      <Image src="/images/logo-dark-white.png" alt="Korvesta" width={1536} height={520} sizes="132px" priority className="absolute inset-0 h-full w-full object-contain object-left dark-logo" />
      <Image src="/images/logo-light-source.png" alt="Korvesta" width={104} height={42} priority className="absolute inset-y-0 left-0 h-full w-[104px] object-contain object-left light-logo" />
    </Link>
  );
}
