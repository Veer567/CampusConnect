import { usePathname } from "expo-router";
import CustomStatusBar from "@/components/CustomStatusBar";
import { COLORS } from "@/constants/themes";

export default function StatusBarController() {
  const pathname = usePathname();

  const hiddenScreens = ["/index", "/profile", "/other-profile"];

  const shouldHide =
    hiddenScreens.includes(pathname) || pathname.startsWith("/hello");

  if (shouldHide) return null;

  return (
    <CustomStatusBar
      colors={[COLORS.primary, COLORS.secondary]}
      style="light"
    />
  );
}
