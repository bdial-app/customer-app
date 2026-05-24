#!/bin/sh
# Reapplies the LocalPackages symlink fix to ios/App/CapApp-SPM/Package.swift.
# Capacitor CLI overwrites this file on every `npx cap sync ios`, reintroducing
# the SPM identity collision between @capacitor/app and @capacitor-firebase/app
# (both resolve to identity "app"). Run this after every cap sync.
set -e
PKG="ios/App/CapApp-SPM/Package.swift"
sed -i '' \
  -e 's|path: "../../../node_modules/@capacitor-firebase/app"|path: "LocalPackages/CapacitorFirebaseApp"|' \
  -e 's|path: "../../../node_modules/@capacitor/app"|path: "LocalPackages/CapacitorApp"|' \
  "$PKG"
echo "patched $PKG"
