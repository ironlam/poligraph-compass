# Expo Learnings

Documented solutions to issues encountered during development. Most recent first.

---

## 2026-03-23 - Deploying Expo Router with Metro Server Output to Vercel

**Problem:** Need correct Vercel configuration for Expo Router app with `output: "server"` (API routes support).

**Solution:**

Use the Vercel Build Output API v3 with Node.js functions. Here's the complete setup:

### vercel.json Configuration

```json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": ".vercel/output",
  "framework": "expo"
}
```

### Build Process

The command `npx expo export --platform web` with `"web": { "bundler": "metro", "output": "server" }` in app.json automatically generates:
- `.vercel/output/static/` directory with static assets (CSS, images, etc.)
- `.vercel/output/functions/` directory with API route functions
- `.vercel/output/config.json` with routing configuration

### Directory Structure After Build

```
.vercel/output/
├── static/                    # Public static files (served by Vercel CDN)
│   └── _expo/chunks/...       # Metro bundled JS chunks
├── functions/
│   └── api/
│       ├── compute.func/      # app/api/compute+api.ts exported as function
│       │   ├── index.js
│       │   └── .vc-config.json
│       └── ...
└── config.json                # Routing rules
```

### .vc-config.json in Function Directories

Vercel automatically generates these with:
```json
{
  "runtime": "nodejs22.x",
  "handler": "index.js",
  "launcherType": "Nodejs"
}
```

### No Additional Packages Required

When using Expo Router with server output mode, the necessary packages are:
- `expo` (SDK 55+)
- `expo-router`
- `react-native` and `react`
- `nativewind@4` (for styling)

No additional Vercel-specific packages needed. Expo's export command handles the Build Output API v3 format automatically.

### Important Notes

- Do NOT manually create vercel.json with custom functions. Expo Router handles this automatically during export.
- The `outputDirectory` is always `.vercel/output` when using Build Output API v3.
- Each route in `app/api/` becomes a separate `.func` directory in the output.
- Static files (fonts, images in public folder, CSS) go to `.vercel/output/static/`.
- NativeWind v4 CSS is bundled into the static output automatically.

### Deployment

1. Connect your GitHub repository to Vercel
2. Vercel will auto-detect the Node.js framework
3. Use the build command: `npx expo export --platform web`
4. Vercel will deploy from `.vercel/output/` automatically

**Source:**
- [Vercel Build Output API v3 Configuration](https://vercel.com/docs/build-output-api/v3/configuration)
- [Vercel Build Output Primitives (Functions)](https://vercel.com/docs/build-output-api/v3/primitives)
- [Expo CLI export command documentation](https://docs.expo.dev/more/expo-cli/)

---
