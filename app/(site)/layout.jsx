import SiteShell from "@/components/layout/SiteShell";

// Layout delle pagine pubbliche migrate a Next.js (Navbar, Footer, chat e banner cookie).
export default function SiteLayout({ children }) {
  return <SiteShell>{children}</SiteShell>;
}
