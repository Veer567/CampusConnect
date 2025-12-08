// app/(tabs)/marketplace/index.tsx
import MarketplaceTabs from "./Tabs"; // your existing TopTabs + header

export default function MarketplaceHome() {
  return <MarketplaceTabs initialTab="project" />;
}