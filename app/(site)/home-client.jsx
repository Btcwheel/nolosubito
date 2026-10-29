"use client";

import Home from "@/views/Home";

// Confine client della home: la vista è la stessa della SPA, ma qui viene prima renderizzata sul server.
export default function HomeClient() {
  return <Home />;
}
