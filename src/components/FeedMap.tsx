import React, { useMemo, useRef } from "react";
import { View, Text, Dimensions } from "react-native";
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from "react-native-maps";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Photo, RootStackParamList } from "../types";
import { truncateAddress, formatSOL } from "../utils/format";
import { colors } from "../theme/colors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CALLOUT_WIDTH = SCREEN_WIDTH * 0.7;

const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1A1A1A" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0A0A0A" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2A2A2A" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0A0A0A" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];

interface FeedMapProps {
  photos: Photo[];
}

export function FeedMap({ photos }: FeedMapProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const mapRef = useRef<MapView>(null);

  const geoPhotos = useMemo(
    () => photos.filter((p) => p.latitude != null && p.longitude != null),
    [photos]
  );

  const initialRegion = useMemo(() => {
    if (geoPhotos.length === 0) {
      return {
        latitude: 20,
        longitude: 0,
        latitudeDelta: 80,
        longitudeDelta: 80,
      };
    }

    if (geoPhotos.length === 1) {
      return {
        latitude: geoPhotos[0].latitude!,
        longitude: geoPhotos[0].longitude!,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    const lats = geoPhotos.map((p) => p.latitude!);
    const lngs = geoPhotos.map((p) => p.longitude!);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const padding = 0.3;

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(maxLat - minLat, 0.02) * (1 + padding),
      longitudeDelta: Math.max(maxLng - minLng, 0.02) * (1 + padding),
    };
  }, [geoPhotos]);

  if (geoPhotos.length === 0) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-8 gap-4">
        <Text
          style={{ fontSize: 40, color: colors.textTertiary }}
        >
          {"◎"}
        </Text>
        <Text className="text-text-primary text-lg font-display-semibold text-center">
          No locations yet
        </Text>
        <Text className="text-text-tertiary text-sm text-center leading-5">
          Photos with GPS enabled will appear on the map.{"\n"}
          Toggle GPS in the camera to start.
        </Text>
      </View>
    );
  }

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={{ flex: 1 }}
      initialRegion={initialRegion}
      customMapStyle={MAP_STYLE}
      showsUserLocation={false}
      showsMyLocationButton={false}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {geoPhotos.map((photo) => {
        const creatorName =
          photo.creator?.display_name || truncateAddress(photo.creator_wallet);

        return (
          <Marker
            key={photo.id}
            coordinate={{
              latitude: photo.latitude!,
              longitude: photo.longitude!,
            }}
            pinColor={colors.primary}
          >
            <Callout
              tooltip
              onPress={() =>
                navigation.navigate("PhotoDetail", { photoId: photo.id })
              }
            >
              <View
                style={{
                  width: CALLOUT_WIDTH,
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                {/* Photo thumbnail */}
                <Image
                  source={{ uri: photo.image_url }}
                  style={{ width: CALLOUT_WIDTH, height: CALLOUT_WIDTH * 0.6 }}
                  contentFit="cover"
                />

                {/* Info */}
                <View style={{ padding: 12, gap: 4 }}>
                  <Text
                    style={{
                      color: colors.textPrimary,
                      fontWeight: "600",
                      fontSize: 14,
                    }}
                  >
                    {creatorName}
                  </Text>

                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    {photo.vouch_count > 0 ? (
                      <Text
                        style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}
                      >
                        {photo.vouch_count} {photo.vouch_count === 1 ? "vouch" : "vouches"}
                      </Text>
                    ) : (
                      <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                        No vouches yet
                      </Text>
                    )}

                    {photo.total_earned_lamports > 0 && (
                      <Text
                        style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }}
                      >
                        {formatSOL(photo.total_earned_lamports)}
                      </Text>
                    )}
                  </View>

                  <Text
                    style={{
                      color: colors.textTertiary,
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    Tap to view details
                  </Text>
                </View>
              </View>
            </Callout>
          </Marker>
        );
      })}
    </MapView>
  );
}
