import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StyleSheet } from "react-native";
import { MenuProvider } from "react-native-popup-menu";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{
                headerTitle: "WorkLog",
                headerTitleAlign: "left",
                headerStyle: {
                  backgroundColor: "#fff",
                },
                headerTintColor: "#000",
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </MenuProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 25,
    fontWeight: "500",
  },
});
