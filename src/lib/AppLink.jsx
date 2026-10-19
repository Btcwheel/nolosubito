"use client";

import React from "react";
import NextLink from "next/link";
import { Link as RouterLink, useInRouterContext } from "react-router-dom";

// Link condiviso tra la SPA (React Router) e le pagine Next.js.
// Dentro la SPA un <NextLink> cambierebbe l'URL senza che BrowserRouter se ne accorga,
// quindi lì si usa il Link di React Router; nelle pagine Next.js il Link di Next.
export default function AppLink({ to, href, ...props }) {
  const target = to ?? href;
  const inRouter = useInRouterContext();
  return inRouter ? <RouterLink to={target} {...props} /> : <NextLink href={target} {...props} />;
}
