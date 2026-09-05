#!/usr/bin/env bash
# Idempotent iOS reverse-engineering toolchain bootstrap (Linux host side).
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ios_re_dir="$repo_root/ios-re"
venv_dir="$ios_re_dir/venv"
tools_dir="$ios_re_dir/tools"

export DEBIAN_FRONTEND=noninteractive

need_apt=0
for pkg in usbmuxd libimobiledevice-utils ifuse ideviceinstaller libusbmuxd-tools openssh-client fuse3; do
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then need_apt=1; break; fi
done

if [ "$need_apt" -eq 1 ]; then
  sudo -n apt-get update -qq
  sudo -n DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
    -o Dpkg::Options::="--force-confnew" \
    usbmuxd libimobiledevice-utils ifuse ideviceinstaller libusbmuxd-tools openssh-client fuse3
fi

if ! python3 -c 'import ensurepip' >/dev/null 2>&1; then
  sudo -n apt-get install -y -qq python3-venv
fi

mkdir -p "$ios_re_dir" "$tools_dir"
[ -d "$venv_dir" ] || python3 -m venv "$venv_dir"
"$venv_dir/bin/pip" install --upgrade pip -q
"$venv_dir/bin/pip" install -r "$ios_re_dir/requirements.txt" -q

if [ ! -d "$tools_dir/frida-ios-dump" ]; then
  git clone --depth 1 https://github.com/AloneMonkey/frida-ios-dump.git "$tools_dir/frida-ios-dump"
fi
"$venv_dir/bin/pip" install -r "$tools_dir/frida-ios-dump/requirements.txt" --upgrade -q
