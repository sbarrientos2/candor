import React from "react";
import { View, Text } from "react-native";
import { Image } from "expo-image";
import { colors } from "../../theme/colors";

const SIZES = {
  sm: 24,
  md: 36,
  lg: 56,
} as const;

interface AvatarProps {
  uri: string | null | undefined;
  name: string;
  size: "sm" | "md" | "lg";
}

export function Avatar({ uri, name, size }: AvatarProps) {
  const px = SIZES[size];
  const fontSize = size === "sm" ? 10 : size === "md" ? 14 : 22;
  const letter = (name || "?").charAt(0).toUpperCase();

  if (uri) {
    return (
      <View
        accessibilityLabel={`Profile photo of ${name}`}
        accessibilityRole="image"
        style={{
          width: px,
          height: px,
          borderRadius: px / 2,
          overflow: "hidden",
        }}
      >
        <Image
          source={{ uri }}
          style={{ width: px, height: px }}
          contentFit="cover"
          transition={150}
        />
      </View>
    );
  }

  return (
    <View
      accessibilityLabel={`Profile photo of ${name}`}
      accessibilityRole="image"
      style={{
        width: px,
        height: px,
        borderRadius: px / 2,
        backgroundColor: colors.surfaceRaised,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize,
          fontWeight: "700",
          color: colors.primary,
        }}
      >
        {letter}
      </Text>
    </View>
  );
}
