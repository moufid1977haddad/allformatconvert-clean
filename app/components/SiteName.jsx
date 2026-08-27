import { Poppins } from 'next/font/google';

const poppins = Poppins({ weight: ['500', '600'], subsets: ['latin'] });

// Single source of truth for the "OnlineConverTools" wordmark: Poppins font
// with O, C, and T in brand blue. Used by Navbar, Footer, and the four auth
// pages so the wordmark can't drift out of sync between them again.
export default function SiteName({ className = '' }) {
  return (
    <span className={`${poppins.className} ${className}`}>
      <span className="text-[#185fa5] dark:text-[#85b7eb]">O</span>nline<span className="text-[#185fa5] dark:text-[#85b7eb]">C</span>onver<span className="text-[#185fa5] dark:text-[#85b7eb]">T</span>ools
    </span>
  );
}
