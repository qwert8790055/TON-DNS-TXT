/**
 * Jailbreak / integrity check bypass — authorized mobile assessment only.
 * Hooks common iOS jailbreak detection APIs.
 */
'use strict';

const JB_PATHS = [
  '/Applications/Cydia.app',
  '/Library/MobileSubstrate/MobileSubstrate.dylib',
  '/bin/bash',
  '/usr/sbin/sshd',
  '/etc/apt',
  '/private/var/lib/apt/',
  '/private/var/stash',
  '/usr/libexec/cydia',
  '/usr/bin/cycript',
  '/usr/local/bin/cycript',
  '/usr/lib/libcycript.dylib',
];

function hookFileManager() {
  const NSFileManager = ObjC.classes.NSFileManager;
  if (!NSFileManager) return;

  const method = NSFileManager['- fileExistsAtPath:'];
  if (!method) return;

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      this.path = ObjC.Object(args[2]).toString();
    },
    onLeave(retval) {
      if (JB_PATHS.some(p => this.path.indexOf(p) !== -1)) {
        retval.replace(0);
      }
    }
  });
}

function hookStat() {
  const stat = Module.findExportByName(null, 'stat');
  if (!stat) return;
  Interceptor.attach(stat, {
    onEnter(args) {
      this.path = args[0].readUtf8String();
    },
    onLeave(retval) {
      if (this.path && JB_PATHS.some(p => this.path.indexOf(p) !== -1)) {
        retval.replace(-1);
      }
    }
  });
}

function hookFork() {
  const fork = Module.findExportByName(null, 'fork');
  if (!fork) return;
  Interceptor.attach(fork, {
    onLeave(retval) {
      retval.replace(-1);
    }
  });
}

function hookDyld() {
  const dladdr = Module.findExportByName(null, 'dladdr');
  if (!dladdr) return;
  Interceptor.attach(dladdr, {
    onEnter(args) {
      this.info = args[1];
    },
    onLeave(retval) {
      if (retval.toInt32() !== 0 && this.info) {
        const fname = this.info.add(Process.pointerSize === 8 ? 8 : 4).readPointer();
        if (!fname.isNull()) {
          const name = fname.readUtf8String();
          if (name && name.indexOf('MobileSubstrate') !== -1) {
            retval.replace(0);
          }
        }
      }
    }
  });
}

setImmediate(function () {
  hookFileManager();
  hookStat();
  hookFork();
  hookDyld();
  console.log('[破甲] jailbreak_bypass.js loaded');
});
