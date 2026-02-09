import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAuthStore } from "../stores/authStore";
import { OnboardingScreen } from "../screens/OnboardingScreen";
import { CameraScreen } from "../screens/CameraScreen";
import { FeedScreen } from "../screens/FeedScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { PhotoDetailScreen } from "../screens/PhotoDetailScreen";
import { UserProfileScreen } from "../screens/UserProfileScreen";
import { colors } from "../theme/colors";
import { RootStackParamList, TabParamList } from "../types";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const CandorDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Camera: "◎",
    Feed: "☰",
    Profile: "◉",
  };
  return (
    <View className="items-center">
      <Text
        style={{
          fontSize: 20,
          color: focused ? colors.primary : colors.textTertiary,
        }}
      >
        {icons[label] || "•"}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          fontFamily: "SpaceGrotesk_600SemiBold",
        },
      })}
    >
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const isOnboarded = useAuthStore((state) => state.isOnboarded);

  return (
    <NavigationContainer theme={CandorDarkTheme}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isOnboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen
              name="PhotoDetail"
              component={PhotoDetailScreen}
              options={{
                headerShown: true,
                headerTitle: "Photo",
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                  fontWeight: "bold",
                  fontFamily: "SpaceGrotesk_700Bold",
                },
              }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={{
                headerShown: true,
                headerTitle: "Profile",
                headerStyle: { backgroundColor: colors.surface },
                headerTintColor: colors.textPrimary,
                headerTitleStyle: {
                  fontWeight: "bold",
                  fontFamily: "SpaceGrotesk_700Bold",
                },
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
