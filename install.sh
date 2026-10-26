#!/bin/bash
# Installs the latest PoppyDesk into /Applications and opens it:
#   curl -fsSL https://volodymyrdem.github.io/PoppyDesk/install.sh | bash
#
# It downloads the same PoppyDesk.dmg as the Download button, from GitHub Releases. Downloaded
# this way rather than by a browser, macOS doesn't stop it with "can't be opened" the first time.
set -euo pipefail

URL="https://github.com/VolodymyrDem/PoppyDesk/releases/latest/download/PoppyDesk.dmg"
APP="/Applications/PoppyDesk.app"

fail() { echo "PoppyDesk: $*" >&2; exit 1; }

[[ "$(uname -s)" == "Darwin" ]] || fail "PoppyDesk is for macOS."
MAJOR="$(sw_vers -productVersion | cut -d. -f1)"
(( MAJOR >= 14 )) || fail "PoppyDesk needs macOS 14 Sonoma or later."

WORK="$(mktemp -d)"
MOUNT="$WORK/mount"
cleanup() {
  hdiutil detach -quiet "$MOUNT" 2>/dev/null || true
  rm -rf "$WORK"
}
trap cleanup EXIT

echo "Downloading PoppyDesk…"
curl -fL --progress-bar -o "$WORK/PoppyDesk.dmg" "$URL" || fail "couldn't download it. Check your connection and try again."

hdiutil attach -nobrowse -readonly -quiet -mountpoint "$MOUNT" "$WORK/PoppyDesk.dmg" || fail "couldn't open the download."
[[ -d "$MOUNT/PoppyDesk.app" ]] || fail "the download doesn't have PoppyDesk in it."
codesign --verify --deep --strict "$MOUNT/PoppyDesk.app" 2>/dev/null || fail "the download is damaged. Try again."

if pgrep -xq PoppyDesk; then
  echo "Quitting PoppyDesk…"
  osascript -e 'quit app "PoppyDesk"' >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do pgrep -xq PoppyDesk || break; sleep 0.5; done
fi

echo "Installing into Applications…"
# Admins can write to /Applications; anyone else is asked for an admin's password.
SUDO=""
[[ -w /Applications ]] || SUDO="sudo"
$SUDO rm -rf "$APP"
$SUDO ditto "$MOUNT/PoppyDesk.app" "$APP"
$SUDO xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true

open "$APP"
echo "PoppyDesk is installed and open. Look for the poppy in your menu bar."
