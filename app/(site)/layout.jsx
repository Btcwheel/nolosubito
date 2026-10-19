import SiteShell from "@/components/layout/SiteShell";
import SiteProviders from "@/components/providers/SiteProviders";

// Layout delle pagine pubbliche migrate a Next.js (Navbar, Footer, chat e banner cookie).
export default function SiteLayout({ children }) {
  return (
    <SiteProviders>
      <SiteShell>{children}</SiteShell>
    </SiteProviders>
  );
}
