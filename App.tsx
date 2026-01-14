import * as React from "react";
import { SQLiteProvider } from "expo-sqlite";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import * as FileSystem from "expo-file-system";
import { Asset } from "expo-asset";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import Home from "./screens/Home";
import Payment from "./screens/sheets/Payment";

const Stack = createNativeStackNavigator();

export default function App() {
  
  return (
    <NavigationContainer>
      <React.Suspense
        fallback={
          <View style={{ flex: 1 }}>
            <ActivityIndicator size={"large"} />
            <Text>Loading Database...</Text>
          </View>
        }
      >
        <SQLiteProvider
          databaseName="mySQLiteDB.db"
          useSuspense
          assetSource={{
            assetId: require("./assets/mySQLiteDB.db"),
          }}
        >
          <Stack.Navigator>
            <Stack.Screen
              name="Home"
              component={Home}
              options={{
    headerTitle: "HELLO Buddy",
    headerTitleAlign: "center",
    headerLeft: () => null,
    headerLargeTitle: Platform.OS === "ios",
    headerTransparent: Platform.OS === "ios",
    headerBlurEffect: Platform.OS === "ios" ? "systemMaterialLight" : undefined,
    headerStyle: {
      backgroundColor: Platform.OS === "android" ? "#E0EAFF" : "transparent",
    },
    headerTitleStyle: {
      fontWeight: "700",
      color: "#1E3A8A",
    },
    headerTintColor: "#1E3A8A",
    headerShadowVisible: false,
  }}
            />
            <Stack.Screen
              name="Payment"
              component={Payment}
              options={{
                presentation: "transparentModal",
                animation: "slide_from_bottom",
                animationTypeForReplace: "pop",
                headerShown: false,
              }}
            />
          </Stack.Navigator>
        </SQLiteProvider>
      </React.Suspense>
    </NavigationContainer>
  );
}
