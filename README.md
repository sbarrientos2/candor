# Candor

**Verified photography on Solana.** Every photo cryptographically sealed at capture. Every vouch costs real SOL.

Candor is a mobile-first dApp where photos are hashed and recorded on-chain the moment you tap the shutter. No filters, no edits, no tampering after the fact. When someone believes in your photo, they vouch for it with real SOL that goes directly to you -- no middlemen, no algorithms.

Built for the [Solana Mobile MONOLITH Hackathon](https://www.solanamobile.com/).

---

## How It Works

### 1. Capture & Verify

Open the camera, tap the shutter. Candor reads the raw image bytes, computes a SHA-256 hash, and submits it to the Solana blockchain via the `verify_photo` instruction. The photo is sealed -- any future modification would produce a different hash, instantly detectable.

Optional GPS coordinates are fuzzed to ~100m precision before going on-chain. Enough to prove you were in the area, never your exact spot.

### 2. Vouch with Real SOL

See a photo you trust? Vouch for it. Your SOL transfers directly from your wallet to the creator's wallet via the `vouch` smart contract -- a peer-to-peer transfer with no intermediary. One vouch per user per photo, enforced at the PDA level.

### 3. Earn

Every vouch you receive is real money. Your profile shows total SOL earned across all photos, with a live USD conversion.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.76 + Expo SDK 52 + TypeScript |
| Styling | NativeWind 4 (Tailwind CSS) + react-native-reanimated |
| Blockchain | Solana (devnet) + Anchor 0.28 |
| Wallet | Solana Mobile Wallet Adapter (MWA) v2 |
| Database | Supabase (PostgreSQL + Storage + RLS) |
| State | TanStack React Query (server) + Zustand (client) |
| Lists | @shopify/flash-list (cell recycling) |
| Maps | react-native-maps (Google Maps) |

---

## On-Chain Program

**Program ID:** `HDvUruses5D2tPCUZnhkLiR4GB2B49GwkpjJJUKjCAvw` (devnet)

Written in Rust with the Anchor framework. Two instructions:

**`verify_photo`** -- Creates a `PhotoRecord` PDA seeded by `[b"photo", creator, image_hash]`. Stores the SHA-256 image hash, optional GPS coordinates (fixed-point i64, actual * 10^7), and a Unix timestamp. Immutable after creation.

**`vouch`** -- Creates a `VouchRecord` PDA seeded by `[b"vouch", voucher, photo_record]`. Transfers SOL directly from voucher to creator via a system program CPI. PDA uniqueness enforces one vouch per user per photo. Self-vouching is rejected on-chain.

The mobile client uses **manual buffer construction** (not the Anchor.js `Program` class) for MWA compatibility. Instruction discriminators are hardcoded SHA-256 prefixes.

---

## Architecture

```
App.tsx
  QueryClientProvider
    ClusterProvider (Solana RPC)
      ConnectionProvider (web3.js)
        SafeAreaProvider
          AppNavigator
            OnboardingScreen (welcome carousel + wallet connect + username)
            MainTabs
              CameraScreen     -- capture, hash, verify on-chain
              FeedScreen       -- explore/following/map views
              NotificationsScreen -- vouch & follow alerts
              ProfileScreen    -- earnings, photos, settings
            PhotoDetailScreen  -- full photo + vouch
            UserProfileScreen  -- public profiles
            UserSearchScreen   -- discover creators
```

### Data Flow

```
Camera Capture
  -> Read bytes (expo-file-system)
  -> SHA-256 hash (expo-crypto)
  -> Optional GPS (expo-location, fuzzed to ~111m)
  -> Build verify_photo TX (manual Anchor buffer)
  -> MWA signs via Phantom
  -> On-chain confirmation
  -> Upload image to Supabase Storage
  -> Insert photo row in database

Vouch
  -> Confirmation dialog (real SOL at stake)
  -> Build vouch TX (SOL transfer via Anchor)
  -> MWA signs via Phantom
  -> On-chain transfer
  -> Insert vouch row + increment_vouch RPC
```

### State Management

- **Server state:** React Query hooks in `src/hooks/`. Screens never call Supabase directly.
- **Client state:** Zustand store persisted to AsyncStorage. Stores `walletAddress` (string), `displayName`, and `isOnboarded`.

---

## Screens

| Screen | Purpose |
|--------|---------|
| **Onboarding** | 4-slide welcome carousel explaining verification, GPS privacy, and vouching. Wallet connect + username setup. |
| **Camera** | Photo capture with front/back toggle, flash animation, optional GPS toggle. Photos are verified on-chain before publishing. |
| **Feed** | FlashList of photo cards with Following/Explore/Map views. Double-tap to vouch with animated feedback. Gold-accented active filter chips. |
| **Notifications** | SectionList grouped by Today/Yesterday/Earlier. Gold-highlighted SOL amounts. Unread indicators. |
| **Profile** | Earnings card with gold border, photo grid, avatar upload, follower/following counts. |
| **Photo Detail** | Full photo view with vouch button, creator info, verification badge. Double-tap vouch support. |
| **User Profile** | Read-only public profile. Follow/unfollow, earnings display, photo grid. |
| **User Search** | Search users by display name with debounced queries. |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Yarn Classic (1.x) -- **npm and pnpm will not work** with the Solana Mobile template
- [EAS CLI](https://docs.expo.dev/eas/) for building native APKs
- A Solana wallet app (Phantom) installed on your device/emulator

### Install

```bash
git clone https://github.com/sbarrientos2/candor.git
cd candor
yarn
```

### Development

```bash
# Start Metro dev server (requires custom dev client APK)
npx expo start --dev-client

# Type check
npx tsc --noEmit
```

### Build

```bash
# Development APK (includes dev tools)
eas build --profile development --platform android

# Preview APK (production-like, internal distribution)
eas build --profile preview --platform android

# Production APK
eas build --profile production --platform android
```

> Splash screen, app icon, and native module changes require an EAS rebuild. JS-only changes hot-reload via Metro.

---

## Project Structure

```
candor/
  src/
    screens/           8 screens
    components/        14 components + 5 UI primitives
    hooks/             10 custom hooks
    services/          anchor.ts, solana.ts, supabase.ts, verification.ts
    stores/            Zustand auth store (AsyncStorage persist)
    navigators/        React Navigation v6 (stack + bottom tabs)
    theme/             colors.ts, shadows.ts
    types/             TypeScript definitions
    utils/             format, crypto, connection helpers
    polyfills.ts       Buffer, TextEncoder, crypto shims for RN
  programs/candor/     Anchor program source (lib.rs)
  supabase/            SQL migrations
  assets/              App icon, splash screen, logo
  app.json             Expo configuration
  eas.json             EAS Build profiles
  tailwind.config.js   NativeWind theme tokens
```

---

## Design System

Dark mode only. Amber/gold accent palette inspired by trust and authenticity.

| Token | Hex | Usage |
|-------|-----|-------|
| `background` | `#0A0A0F` | Screen backgrounds |
| `surface` | `#14141A` | Cards, inputs |
| `surface-raised` | `#1E1E26` | Elevated elements |
| `border` | `#25252E` | Dividers |
| `primary` | `#E8A838` | Amber accent -- vouch buttons, earnings, badges |
| `primary-light` | `#F5C563` | Active/hover states |
| `text-primary` | `#F0EDEA` | Main text |
| `text-secondary` | `#999999` | Supporting text |
| `text-tertiary` | `#666666` | Muted text, placeholders |
| `success` | `#4ADE80` | Verified badge, available username |
| `error` | `#EF4444` | Error states, unread badge |

Typography uses [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) for display text (headings, buttons, amounts) and system default (Roboto) for body text.

Gold glow shadows on primary action buttons (iOS colored shadows, Android elevation fallback) add depth on the dark canvas.

---

## Database

Supabase PostgreSQL with Row Level Security.

**Tables:** `users`, `photos`, `vouches`, `follows`, `notifications`

**Key constraints:**
- One vouch per user per photo (`UNIQUE(photo_id, voucher_wallet)`)
- One follow relationship per pair (`UNIQUE(follower_wallet, following_wallet)`)
- Unique display names

**Triggers** auto-populate foreign keys from wallet addresses and auto-create notifications on vouch/follow events.

**Storage:** `photos` bucket (public read) for uploaded images.

---

## Key Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| `@coral-xyz/anchor` | `0.28.0` | Pinned -- only version compatible with React Native |
| `@solana/web3.js` | `^1.78.4` | Must stay on v1 -- Anchor incompatible with v2 |
| `nativewind` | `4.1.23` | Pinned exact -- higher versions pull incompatible worklets |
| `react-native-reanimated` | `~3.17.4` | Animations + NativeWind CSS interop |
| `@shopify/flash-list` | `^2.2.2` | Cell recycling for smooth feed scrolling |
| `react-native-maps` | `1.18.0` | Google Maps for feed map view |
| `expo-camera` | `~16.0.18` | Tied to Expo SDK 52 |

---

## License

MIT
