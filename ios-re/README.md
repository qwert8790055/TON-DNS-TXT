# iOS Reverse Engineering Environment (Linux)

Linux-side toolchain for the [AndroidSecurityStudy Student/002](https://github.com/r0ysue/AndroidSecurityStudy/blob/master/Student/002/README.md) course: *挑战不用 macOS 逆向 iOS APP* (reverse iOS apps without macOS).

This setup targets a **jailbroken iPhone** (tutorial recommends iPhone 6 on iOS 12.x with checkra1n or unc0ver). Connect the device over USB and trust the host before running commands below.

## Quick start

```bash
# One-time bootstrap (also run automatically via .cursor/install.sh)
bash .cursor/ios-re-install.sh

# Activate the Python toolchain
source ios-re/venv/bin/activate
```

## Installed tools

| Category | Tools |
|---|---|
| Device info | `idevice_id`, `idevicename`, `ideviceinfo`, `idevicescreenshot`, `idevicesetlocation` |
| App management | `ideviceinstaller` |
| File transfer | `ifuse`, `iproxy`, `scp` (via OpenSSH on device) |
| Firmware | `ideviceenterrecovery`, `idevicerestore`, `ideviceactivation` |
| Dynamic analysis | `frida`, `frida-ps`, `objection` |
| IPA dumping | `ios-re/tools/frida-ios-dump/dump.py` |

## Common workflows

### 1. Check connected device

```bash
idevice_id -l          # device UUID
idevicename            # device name
ideviceinfo            # full device details
```

### 2. Screenshot and mock location

```bash
idevicescreenshot shot.png
idevicesetlocation -- 35.10463 117.193626   # example: Shandong coordinates
```

### 3. Install / list / uninstall apps

```bash
ideviceinstaller -l
ideviceinstaller -i /path/to/app.ipa
ideviceinstaller -U com.example.bundleid
```

### 4. Mount filesystem (jailbroken device)

```bash
mkdir -p /tmp/iphone
ifuse --root /tmp/iphone
# copy files freely under /tmp/iphone
fusermount -u /tmp/iphone
```

### 5. SSH file transfer (OpenSSH on device: root/alpine)

```bash
iproxy 2222 22 &
scp -P 2222 local.txt root@127.0.0.1:/var/mobile/
scp -P 2222 root@127.0.0.1:/var/mobile/remote.txt ./
```

### 6. Frida / Objection dynamic analysis

On the **device** (via Cydia): install `frida-server` matching the host Frida version.

```bash
source ios-re/venv/bin/activate
frida-ps -U                    # list processes on USB device
objection -g com.app.bundle explore
```

Check versions match:

```bash
frida --version                  # host
# on device: frida-server --version
```

### 7. Dump decrypted IPA (frida-ios-dump)

```bash
source ios-re/venv/bin/activate
iproxy 2222 22 &
cd ios-re/tools/frida-ios-dump
python dump.py "App Display Name"
```

## Jailbreak prerequisites (on device)

From the course material, install via Cydia after jailbreak:

- **Cydia stock sources:** oslog, OpenSSH, Filza, Apple File Conduit "2"
- **Third-party source** `cydia.angelxwind.net`: AppSync Unified (unsigned IPA install)
- **frida-server** deb matching host Frida version

Default SSH credentials: `root` / `alpine` — change immediately after first login.

## Hardware notes

- **iPhone 6** (max iOS 12.5.4) is the recommended low-cost target; failed jailbreak recovery won't jump past tool support.
- Avoid **iCloud-locked** devices; a failed jailbreak can brick usability.
- **checkra1n** is more stable; **unc0ver** is simpler but less reliable.

## Windows-side tools (reference)

The course also covers Windows workflows with 爱思助手 (i4Tools) for device info, app install, and screen mirroring — not needed on this Linux environment.
