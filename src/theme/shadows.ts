import { Platform, ViewStyle } from "react-native";

export const goldGlow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#E8A838",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  android: {
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(232,168,56,0.3)",
  },
}) as ViewStyle;

export const subtleGoldGlow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#E8A838",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(232,168,56,0.2)",
  },
}) as ViewStyle;

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  android: {
    elevation: 6,
  },
}) as ViewStyle;
