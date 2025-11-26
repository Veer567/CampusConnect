import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LostFoundScreen from "./index";
import Add from "./add";
import Edit from "./edit";

const Stack = createNativeStackNavigator();

export default function LostFoundTabNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="LostFoundHome" component={LostFoundScreen} />
      <Stack.Screen name="LostFoundAdd" component={Add} />
      <Stack.Screen name="LostFoundEdit" component={Edit} />
    </Stack.Navigator>
  );
}
