---
name: candor-react-native-ui
description: Create distinctive, production-grade React Native interfaces for the Candor app using NativeWind (Tailwind), Reanimated 3, and Expo. Use this skill whenever building, styling, or improving any screen, component, or animation in the Candor mobile app. Produces polished, crypto-native UI that avoids generic AI aesthetics and follows Candor's established architecture.
---

# Candor React Native UI Skill

This skill guides creation of distinctive, polished mobile UI for the Candor app — a Solana-based verified photography platform built with React Native, Expo, NativeWind, and Reanimated. Every screen and component should feel premium, crypto-native, and intentionally designed.

## Stack Reference

Before writing ANY UI code, internalize these constraints:

| Layer | Technology | Key Notes |
|-------|-----------|-----------|
| Framework | React Native 0.76 + Expo SDK 52 | No raw HTML/CSS — everything is RN components |
| Styling | NativeWind 4.1 + Tailwind 3.4 | Use `className` props. Tailwind classes only — no StyleSheet.create unless dynamic values are needed |
| Animations | react-native-reanimated 3.17 | `useSharedValue`, `useAnimatedStyle`, `withTiming`, `withSpring`, `withSequence`. Use `Animated.*` components from reanimated |
| Images | expo-image 2.0 | Use `<Image>` from expo-image, NOT `<Image>` from react-native. Supports `contentFit`, `transition`, `placeholder` |
| Navigation | React Navigation v6 | native-stack + bottom-tabs. Typed via `RootStackParamList` / `TabParamList` |
| Server State | @tanstack/react-query 5 | All data fetching through custom hooks in `src/hooks/`. Never call Supabase directly from screens |
| Client State | Zustand 5 | Single auth store. Import `useAuthStore()` directly — no provider needed |
| Safe Area | react-native-safe-area-context | Always wrap edge-to-edge screens with `SafeAreaView` or use `useSafeAreaInsets()` |

## Design System — Candor Tokens

### Colors (defined in `src/theme/colors.ts` + `tailwind.config.js`)

```
Background:     #0A0A0A  (bg-background)      — near-black, the canvas
Surface:        #1A1A1A  (bg-surface)          — cards, inputs, modals
Surface Raised: #242424  (bg-surface-raised)   — elevated cards, pressed states
Border:         #2A2A2A  (border-border)       — subtle dividers

Primary:        #E8A838  (text-primary / bg-primary)  — warm amber: CTAs, badges, earnings
Primary Light:  #F5C563  (text-primary-light)          — hover/active states

Text Primary:   #FFFFFF  (text-text-primary)   — headings, important content
Text Secondary: #999999  (text-text-secondary) — descriptions, metadata
Text Tertiary:  #666666  (text-text-tertiary)  — timestamps, hints

Success:        #4ADE80  — confirmations, verified states
Error:          #EF4444  — failures, destructive actions
```

### Color Philosophy
Candor is a **dark-first** app. The warm amber (#E8A838) is the signature accent — it represents trust, verification, and value. Use it sparingly for maximum impact: verification badges, earnings displays, primary CTAs, and the vouch interaction. Everything else should breathe in the dark palette with generous contrast.

**Never:**
- Use amber for decorative/non-functional elements
- Create purple/blue gradient backgrounds (crypto cliché)
- Use neon colors or rainbow gradients
- Apply amber to large surface areas — it loses its power

**Do:**
- Let the dark background create depth through layered surfaces (#0A0A0A → #1A1A1A → #242424)
- Use amber as punctuation, not prose
- Create subtle depth with opacity and blur rather than strong color contrasts
- Use text opacity levels (100%, 60%, 40%) for information hierarchy

### Typography

Currently using system defaults (Roboto on Android). When adding custom fonts, follow these principles:

- **Display/Headings**: Use a distinctive, modern sans-serif. Consider: Satoshi, General Sans, Switzer, Cabinet Grotesk, or Clash Display (available via Google Fonts or Expo Google Fonts). Avoid Inter, Roboto, SF Pro for headings — they're invisible.
- **Body text**: System font is fine for body. Readability > personality at small sizes.
- **Monospace (hashes, addresses, amounts)**: Use a clean mono like JetBrains Mono, Space Mono, or IBM Plex Mono. Crypto apps need good monospace.

**Font loading with Expo:**
```typescript
import { useFonts } from 'expo-font';
// or
import { useFonts, Satoshi_700Bold } from '@expo-google-fonts/satoshi';
```

### Spacing & Layout

- Use Tailwind spacing scale consistently: `p-4`, `gap-3`, `mb-6`
- Cards: `p-4 rounded-2xl bg-surface` — generous padding, large radii
- Screen padding: `px-4` or `px-5` — never `px-2` (too cramped on mobile)
- Between sections: `gap-6` or `mb-8` — let content breathe
- Touch targets: minimum `h-12 w-12` (48dp) for all interactive elements
- Bottom tab safe area: always account for tab bar height + safe area insets

## Component Patterns

### Screen Template
```tsx
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ExampleScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8"
        showsVerticalScrollIndicator={false}
      >
        {/* Screen content */}
      </ScrollView>
    </View>
  );
}
```

### Card Component Pattern
```tsx
<View className="bg-surface rounded-2xl p-4 gap-3">
  {/* Card content */}
</View>
```

For elevated/interactive cards:
```tsx
<Pressable className="bg-surface rounded-2xl p-4 gap-3 active:bg-surface-raised">
  {/* Pressable card content */}
</Pressable>
```

### Loading States
Always use the amber accent for loading indicators:
```tsx
<View className="flex-1 bg-background items-center justify-center">
  <ActivityIndicator size="large" color="#E8A838" />
</View>
```

For skeleton loading (preferred for feeds and content):
```tsx
// Use reanimated for a shimmer pulse animation
const opacity = useSharedValue(0.3);

useEffect(() => {
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.7, { duration: 800 }),
      withTiming(0.3, { duration: 800 })
    ),
    -1, // infinite
    false
  );
}, []);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

// Apply to placeholder shapes:
<Animated.View style={animatedStyle} className="bg-surface-raised rounded-2xl h-64 w-full" />
```

### Empty States
Empty states should feel intentional, not broken:
```tsx
<View className="flex-1 items-center justify-center px-8 gap-4">
  {/* Contextual icon or illustration */}
  <Text className="text-text-primary text-lg font-semibold text-center">
    {title}
  </Text>
  <Text className="text-text-tertiary text-sm text-center leading-5">
    {description}
  </Text>
  {/* Optional CTA */}
</View>
```

## Animation Guidelines

### Principles
1. **Physics-based by default**: Use `withSpring` over `withTiming` for interactive feedback (button presses, card interactions). Spring configs: `{ damping: 15, stiffness: 150 }` for snappy, `{ damping: 20, stiffness: 80 }` for gentle.
2. **Timing for reveals**: Use `withTiming` with `Easing.out(Easing.cubic)` for entrance animations (staggered list items, screen transitions).
3. **Staggered entrances**: When a list loads, stagger each item's entrance by 50-80ms. Creates a cascade that feels alive.
4. **Meaningful motion**: Every animation should communicate something — a vouch flying to the creator, a badge appearing with weight, earnings ticking up.
5. **60fps or nothing**: Always use `useAnimatedStyle` and the UI thread. Never animate with `setState`.

### Key Animation Patterns

**Vouch Button — The Signature Interaction:**
The vouch is Candor's core action. It should feel substantial and rewarding:
```tsx
// Scale down on press, spring back with overshoot
const scale = useSharedValue(1);
const rotation = useSharedValue(0);

const handlePressIn = () => {
  scale.value = withSpring(0.9, { damping: 15, stiffness: 200 });
};

const handlePressOut = () => {
  scale.value = withSpring(1, { damping: 10, stiffness: 150 });
  // Trigger a subtle rotation wiggle on success
  rotation.value = withSequence(
    withTiming(-3, { duration: 50 }),
    withTiming(3, { duration: 50 }),
    withTiming(0, { duration: 50 })
  );
};
```

**Staggered List Entry:**
```tsx
const translateY = useSharedValue(20);
const opacity = useSharedValue(0);

useEffect(() => {
  const delay = index * 60; // 60ms stagger per item
  translateY.value = withDelay(delay, withTiming(0, { duration: 400, easing: Easing.out(Easing.cubic) }));
  opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
}, []);
```

**Verification Badge Entrance:**
```tsx
// Scale from 0 with a satisfying spring overshoot
const badgeScale = useSharedValue(0);

useEffect(() => {
  badgeScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 120 }));
}, []);
```

**Number Counter (Earnings/Vouch Count):**
```tsx
// Animate numbers counting up for earnings display
const displayValue = useSharedValue(0);

useEffect(() => {
  displayValue.value = withTiming(targetValue, { duration: 1200, easing: Easing.out(Easing.cubic) });
}, [targetValue]);
```

### Gesture Interactions
Use `react-native-gesture-handler` (already included via Expo) for:
- Pull-to-refresh with custom animated headers
- Swipe actions on cards (if needed)
- Pinch-to-zoom on photo detail

### Haptic Feedback
Add haptics for key moments (requires `expo-haptics`):
- Vouch success: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
- Button press: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
- Error: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)`

## Screen-Specific Design Guidance

### FeedScreen
- **Photo cards**: Full-width images with a subtle rounded corner (rounded-xl). Photo should dominate — metadata below.
- **Pull-to-refresh**: Use amber spinner. Consider a custom refresh indicator with the Candor mark.
- **Infinite scroll**: Show skeleton cards at the bottom while loading more.
- **Transitions**: Tapping a card should use a shared element transition feel — the image expanding to fill PhotoDetailScreen.

### CameraScreen
- **Full-bleed viewfinder**: Camera should fill the entire screen. Controls overlay on top.
- **Capture button**: Large, centered, with a satisfying press animation (scale + ring pulse).
- **GPS indicator**: Subtle badge showing location status (active/inactive) in a corner.
- **Post-capture**: Brief review with clear confirm/retake actions.

### ProfileScreen
- **Photo grid**: 3-column masonry or uniform grid. Consistent gap-1 or gap-0.5 for tight grid feel.
- **Header**: Wallet address (truncated, monospace), display name, total earnings prominently displayed.
- **Stats row**: Vouch count, photo count, earnings — use the amber accent for the earnings value.
- **Edit mode**: Inline editing for display name with clear save/cancel states.

### PhotoDetailScreen
- **Hero image**: Full-width, expandable with pinch-to-zoom.
- **Verification proof section**: Show the on-chain verification details with monospace text for hashes and addresses. Make this feel like a "certificate" — clean, structured, trustworthy.
- **Vouch list**: Scrollable list of vouchers with amounts. Each vouch entry should show the voucher's address and the SOL amount in amber.
- **Vouch CTA**: Fixed at the bottom. Prominent, animated, inviting.

### OnboardingScreen
- **Hero moment**: This is the first impression. Bold typography, the Candor value prop.
- **Wallet connect**: Make the MWA connection button feel premium. Large, centered, with the wallet icon.
- **Username selection**: Clean input with real-time availability check. Success/error states with smooth transitions.
- **Progressive disclosure**: Don't overwhelm — one step at a time with smooth transitions between steps.

## Anti-Patterns — What to AVOID

### Styling
- ❌ `StyleSheet.create` for static styles — use NativeWind className instead
- ❌ Inline `style={{}}` for things Tailwind can handle (colors, padding, margins, flexbox)
- ❌ Generic styling with no personality — every screen should feel like Candor
- ❌ Inconsistent spacing — stick to the Tailwind scale
- ❌ Small touch targets (under 44dp)
- ❌ Flat, lifeless screens with no depth or layering

### Animation
- ❌ `Animated` from react-native — always use `react-native-reanimated`
- ❌ `setState`-driven animations — always use shared values on the UI thread
- ❌ Animations with no purpose (spinning logos, bouncing elements for no reason)
- ❌ Heavy layout animations that cause jank — prefer transform and opacity
- ❌ Missing loading/transition states (jarring content pops)

### Architecture
- ❌ Calling Supabase directly from screen components — use hooks in `src/hooks/`
- ❌ Importing `react-native` Image — use `expo-image`
- ❌ Creating new Zustand stores for UI state — use `useState`/`useReducer` for local UI state
- ❌ Untyped navigation — always use the typed nav params from `src/types/index.ts`
- ❌ Hardcoding color values — use the theme tokens from `colors.ts` or Tailwind classes

## Quality Checklist

Before considering any screen or component complete, verify:

- [ ] All colors come from the Candor design tokens (no hardcoded hex except in theme files)
- [ ] Touch targets are minimum 48dp
- [ ] Loading states are implemented (skeleton or spinner)
- [ ] Empty states are designed with clear messaging
- [ ] Error states are handled gracefully with retry options
- [ ] Animations use Reanimated, run on UI thread, and serve a purpose
- [ ] Safe area insets are respected (top, bottom, and tab bar)
- [ ] Content is accessible: sufficient contrast, meaningful labels
- [ ] Images use expo-image with proper `contentFit` and `transition` props
- [ ] Lists use `FlatList` with proper `keyExtractor` and `getItemLayout` when possible
- [ ] Pull-to-refresh is implemented on scrollable content
- [ ] Navigation follows existing patterns (typed, stack/tab structure)

## Creative Direction

Candor is about **truth in a world of fakes**. The UI should feel:

- **Confident**: Clean lines, strong typography, intentional use of space
- **Trustworthy**: The amber verification badge is earned, not decorative
- **Premium**: Dark, layered surfaces with subtle depth. Think high-end camera app meets crypto wallet
- **Alive**: Micro-interactions and spring animations that make the app feel responsive and tactile
- **Focused**: Photography is the hero. UI should frame and elevate the photos, not compete with them

The aesthetic sits at the intersection of **camera app minimalism** (like VSCO's restraint) and **crypto-native confidence** (like Phantom's polish). Not flashy, but unmistakably intentional.
