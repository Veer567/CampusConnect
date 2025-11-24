import { useLocalSearchParams } from "expo-router";
import MarketplaceTabs from "../MarketplaceTabs";

export default function MarketplacePage() {
  const { tab } = useLocalSearchParams();

  const normalizedTab =
    tab === "project" || tab === "hackathon" || tab === "startup"
      ? (tab as "project" | "hackathon" | "startup")
      : undefined;

  return <MarketplaceTabs initialTab={normalizedTab} />;
}
