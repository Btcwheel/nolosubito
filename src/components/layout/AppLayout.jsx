import React from "react";
import { Outlet } from "react-router-dom";
import SiteShell from "./SiteShell";
import ScrollToTop from "./ScrollToTop";

// Layout delle rotte pubbliche ancora gestite dalla SPA (React Router).
export default function AppLayout() {
  return (
    <SiteShell>
      <ScrollToTop />
      <Outlet />
    </SiteShell>
  );
}
