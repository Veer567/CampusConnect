import { usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function StatusBarController() {
  const pathname = usePathname() || "";

  const lightScreens = [
    "/profile",
    "/other-profile",
    "/search",
    "/edit-post",
    "/post-details",
    "/lost-found/add",
    "/lost-found/edit",
  ];

  const isLight =
    lightScreens.some((p) => pathname === p || pathname.startsWith(p)) ||
    pathname.includes("settings") ||
    pathname.includes("reset-password") ||
    pathname.includes("create");

  return (
    <StatusBar
      translucent
      backgroundColor="transparent"
      style={isLight ? "dark" : "light"}
    />
  );
}
