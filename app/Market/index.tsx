import { useLocalSearchParams } from "expo-router";
import MarketplaceTabs from "../MarketplaceTabs";

export default function MarketIndex() {
  const { tab } = useLocalSearchParams();

  return (
    <MarketplaceTabs
      initialTab={
        tab === "project" || tab === "hackathon" || tab === "startup"
          ? tab
          : "project"
      }
    />
  );
}
