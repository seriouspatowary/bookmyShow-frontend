"use client";

import { usePathname } from "next/navigation";
import Navbar from "./components/Navbar";
import Header from "./components/Header";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/admin");

  return (
    <>
      {!isAdmin && (
        <>
          <Navbar />
          <Header />
        </>
      )}

      {children}
    </>
  );
}