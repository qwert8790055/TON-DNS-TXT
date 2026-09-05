/**
 * Anti-debug / ptrace bypass — authorized mobile assessment only.
 */
'use strict';

function bypassPtrace() {
  const ptrace = Module.findExportByName(null, 'ptrace');
  if (!ptrace) return;
  Interceptor.attach(ptrace, {
    onEnter(args) {
      const request = args[0].toInt32();
      // PT_DENY_ATTACH = 31
      if (request === 31) {
        args[0] = ptr(0);
      }
    },
    onLeave(retval) {
      retval.replace(0);
    }
  });
}

function bypassSysctl() {
  const sysctl = Module.findExportByName(null, 'sysctl');
  if (!sysctl) return;
  Interceptor.attach(sysctl, {
    onEnter(args) {
      this.name = args[0];
      this.oldp = args[2];
    },
    onLeave(retval) {
      if (retval.toInt32() === 0 && this.name && this.oldp) {
        try {
          const mib = this.name.readByteArray(8);
          // CTL_KERN=1, KERN_PROC=14, KERN_PROC_PID=1
          if (mib && mib[0] === 1 && mib[1] === 14) {
            // P_TRACED flag at kp_proc.p_flag offset varies; zero common offset
            this.oldp.add(32).writeU32(0);
          }
        } catch (_) {}
      }
    }
  });
}

function bypassIsatty() {
  const isatty = Module.findExportByName(null, 'isatty');
  if (!isatty) return;
  Interceptor.attach(isatty, {
    onLeave(retval) {
      retval.replace(0);
    }
  });
}

setImmediate(function () {
  bypassPtrace();
  bypassSysctl();
  bypassIsatty();
  console.log('[破甲] anti_debug_bypass.js loaded');
});
