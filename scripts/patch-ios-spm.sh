#!/bin/sh
# Reapplies the LocalPackages symlink fix to ios/App/CapApp-SPM/Package.swift.
# Capacitor CLI overwrites this file on every `npx cap sync ios`, reintroducing
# the SPM identity collision between @capacitor/app and @capacitor-firebase/app
# (both resolve to identity "app"). Runs automatically via the
# `capacitor:update:after` hook in package.json (fired by cap sync and cap update).
set -e
if [ -n "$CAPACITOR_PLATFORM_NAME" ] && [ "$CAPACITOR_PLATFORM_NAME" != "ios" ]; then
  exit 0
fi
PKG="ios/App/CapApp-SPM/Package.swift"
sed -i '' \
  -e 's|path: "../../../node_modules/@capacitor-firebase/app"|path: "LocalPackages/CapacitorFirebaseApp"|' \
  -e 's|path: "../../../node_modules/@capacitor/app"|path: "LocalPackages/CapacitorApp"|' \
  "$PKG"
echo "patched $PKG"
