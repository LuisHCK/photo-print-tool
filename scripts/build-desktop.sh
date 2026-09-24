#!/bin/bash
#
# Build the macOS desktop app as a universal (arm64 + x86_64) .app bundle,
# then package it into a DMG in a single run.
#
# Usage:
#   ./scripts/build-desktop.sh            # build the .app and package a DMG
#   ./scripts/build-desktop.sh --no-dmg   # build the .app only
#
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/desktop/build"
APP="$BUILD_DIR/photo-print.app"
ARCHS="arm64;x86_64"
DEPLOYMENT_TARGET="13.0"
WANT_DMG=1

for arg in "$@"; do
  case "$arg" in
    --dmg) WANT_DMG=1 ;;
    --no-dmg) WANT_DMG=0 ;;
    *) echo "Unknown argument: $arg" >&2; exit 1 ;;
  esac
done

if [ "$(uname -s)" != "Darwin" ]; then
  echo "This script only builds the macOS .app bundle." >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 1. Build the web frontend (service worker disabled for file:// loading)
# ---------------------------------------------------------------------------
echo "==> Building web assets..."
( cd "$ROOT_DIR" && VITE_DESKTOP=1 bun run build )

# ---------------------------------------------------------------------------
# 2. Configure + build the universal native bundle
# ---------------------------------------------------------------------------
# A stale cache built for another architecture would produce a thin binary,
# so wipe it when the requested architectures differ.
if [ -f "$BUILD_DIR/CMakeCache.txt" ]; then
  cached_archs="$(sed -n 's/^CMAKE_OSX_ARCHITECTURES:[^=]*=//p' "$BUILD_DIR/CMakeCache.txt")"
  if [ "$cached_archs" != "$ARCHS" ]; then
    echo "==> Architecture changed ($cached_archs -> $ARCHS); cleaning build dir..."
    rm -rf "$BUILD_DIR"
  fi
fi

echo "==> Configuring CMake ($ARCHS, min macOS $DEPLOYMENT_TARGET)..."
cmake -S "$ROOT_DIR/desktop" -B "$BUILD_DIR" \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_OSX_ARCHITECTURES="$ARCHS" \
  -DCMAKE_OSX_DEPLOYMENT_TARGET="$DEPLOYMENT_TARGET" \
  -DFETCHCONTENT_QUIET=OFF

echo "==> Compiling..."
cmake --build "$BUILD_DIR" --config Release --parallel

if [ ! -d "$APP" ]; then
  echo "Expected bundle not found at $APP" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 3. Bundle the web assets
# ---------------------------------------------------------------------------
echo "==> Bundling web assets into Contents/Resources/dist..."
mkdir -p "$APP/Contents/Resources/dist"
rsync -a --delete "$ROOT_DIR/dist/" "$APP/Contents/Resources/dist/"

# ---------------------------------------------------------------------------
# 4. Generate the app icon
# ---------------------------------------------------------------------------
echo "==> Generating AppIcon.icns..."
ICONSET="$(mktemp -d)/AppIcon.iconset"
mkdir -p "$ICONSET"
SRC_ICON="$ROOT_DIR/public/web-app-manifest-512x512.png"
sips -z 16 16     "$SRC_ICON" --out "$ICONSET/icon_16x16.png"      >/dev/null
sips -z 32 32     "$SRC_ICON" --out "$ICONSET/icon_16x16@2x.png"   >/dev/null
sips -z 32 32     "$SRC_ICON" --out "$ICONSET/icon_32x32.png"      >/dev/null
sips -z 64 64     "$SRC_ICON" --out "$ICONSET/icon_32x32@2x.png"   >/dev/null
sips -z 128 128   "$SRC_ICON" --out "$ICONSET/icon_128x128.png"    >/dev/null
sips -z 256 256   "$SRC_ICON" --out "$ICONSET/icon_128x128@2x.png" >/dev/null
sips -z 256 256   "$SRC_ICON" --out "$ICONSET/icon_256x256.png"    >/dev/null
sips -z 512 512   "$SRC_ICON" --out "$ICONSET/icon_256x256@2x.png" >/dev/null
sips -z 512 512   "$SRC_ICON" --out "$ICONSET/icon_512x512.png"    >/dev/null
sips -z 1024 1024 "$SRC_ICON" --out "$ICONSET/icon_512x512@2x.png" >/dev/null
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"
rm -rf "$(dirname "$ICONSET")"

# ---------------------------------------------------------------------------
# 5. Ad-hoc sign (no Developer ID certificate required)
# ---------------------------------------------------------------------------
echo "==> Ad-hoc signing..."
codesign --force --deep --sign - "$APP"

# ---------------------------------------------------------------------------
# 6. Verify
# ---------------------------------------------------------------------------
echo "==> Verifying architectures..."
lipo -info "$APP/Contents/MacOS/photo-print"
codesign --verify --verbose=2 "$APP"
echo "==> Built: $APP"

# ---------------------------------------------------------------------------
# 7. Optionally package a DMG
# ---------------------------------------------------------------------------
if [ "$WANT_DMG" -eq 1 ]; then
  echo "==> Packaging DMG..."
  STAGE="$(mktemp -d)"
  cp -R "$APP" "$STAGE/"
  ln -s /Applications "$STAGE/Applications"
  DMG="$BUILD_DIR/PhotoPrintTool.dmg"
  rm -f "$DMG"
  hdiutil create -volname "Photo Print Tool" -srcfolder "$STAGE" -ov -format UDZO "$DMG" >/dev/null
  rm -rf "$STAGE"
  echo "==> DMG: $DMG"
fi
