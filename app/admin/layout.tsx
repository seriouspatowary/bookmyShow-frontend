"use client";

import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AuthInitializer from "../AuthInitializer";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { user, isAuthenticated } = useSelector(
    (state: any) => state.auth
  );

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (user?.role !== "administrator") {
      router.replace("/");
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || user?.role !== "administrator") {
    return null;
  }

  return <>
   <AuthInitializer />
    {children}
  </>;
}