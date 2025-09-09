import { Redirect } from "expo-router";

export default function rIndex() {
  return <Redirect href="/(auth)/login" />;
}
