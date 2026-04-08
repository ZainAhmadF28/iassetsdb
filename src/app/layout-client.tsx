"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import Preloader from "@/components/Preloader";
import { useEffect } from "react";

const publicRoutes = ["/login"];

export default function RootLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading) {
      // If not logged in and trying to access protected route, redirect to login
      if (!user && !isPublicRoute) {
        router.push("/login");
      }
      // If logged in and trying to access login page, redirect to home
      if (user && pathname === "/login") {
        router.push("/");
      }
    }
  }, [user, loading, pathname, isPublicRoute, router]);

  // Show preloader while checking authentication
  if (loading) {
    return <Preloader />;
  }

  // If not logged in and trying to access protected route, show preloader
  if (!user && !isPublicRoute) {
    return <Preloader />;
  }

  return children;
}
