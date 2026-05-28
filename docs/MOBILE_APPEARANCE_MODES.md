# Mobile Appearance Modes

## Purpose

Traffiq supports three appearance modes in the mobile app:

```text
system
dark
light
```

This completes the existing `theme_mode` preference that was already stored in
PostgreSQL.

## Architecture

The mobile app now uses:

```text
mobile/src/context/ThemeContext.tsx
```

The provider stores the selected mode locally with AsyncStorage and exposes:

```text
mode
resolvedMode
colors
setThemeMode
```

`system` follows the Android device color scheme through React Native
`useColorScheme()`.

`dark` and `light` override the system setting.

## Theme Tokens

Theme tokens live in:

```text
mobile/src/theme/theme.ts
```

The file now exposes:

```text
darkColors
lightColors
themes
ThemeColors
radius
spacing
shadows
```

The existing dark theme remains the default visual identity. The light theme
uses the same green Traffiq accent, but switches surfaces, cards, text, and
borders to a readable light palette.

## Authenticated Behavior

Authenticated users use the existing backend preference:

```text
silver.user_preferences.theme_mode
```

Account screen behavior:

- changing Appearance saves the value through `PUT /preferences`
- the selected value is also applied immediately on the device
- Drive screen loads `theme_mode` with the existing distance unit preference

## Guest Behavior

Guest users can also change Appearance from Account.

For guests, the selection is local-only:

```text
AsyncStorage key -> traffiq.preferences.themeMode.v1
```

No Cognito account is required for local theme use.

## Screens And Components

The following mobile surfaces consume runtime theme colors:

- Drive
- History
- Account
- Pipeline
- Auth
- Empty state
- Error state
- Loading state
- Suceava map chrome
- Traffic profile chart

## Validation

Task 36F validation:

```text
npx.cmd tsc --noEmit -> passed
npx.cmd expo-doctor --verbose -> 18/18 checks passed
npx.cmd expo export --platform android --output-dir .expo-export-task36f -> passed
temporary export artifact -> deleted
```

No APK was generated in this task.
