import React from "react";
import { View, Text } from "react-native";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-baseline justify-between mb-3">
      <View className="flex-1">
        <Text className="text-text-primary text-lg font-display-bold">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-text-secondary text-sm mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </View>
  );
}
