/**
 * SSL/TLS pinning bypass — authorized mobile assessment only.
 */
'use strict';

function bypassNSURLSession() {
  if (!ObjC.available) return;
  const cls = ObjC.classes.NSURLSession;
  if (!cls) return;

  const sel = '- setDelegate:';
  const method = cls[sel];
  if (!method) return;

  Interceptor.attach(method.implementation, {
    onEnter(args) {
      console.log('[破甲] NSURLSession delegate set — monitor for custom validation');
    }
  });
}

function bypassSecTrustEvaluate() {
  const SecTrustEvaluate = Module.findExportByName('Security', 'SecTrustEvaluate');
  const SecTrustEvaluateWithError = Module.findExportByName('Security', 'SecTrustEvaluateWithError');

  if (SecTrustEvaluate) {
    Interceptor.attach(SecTrustEvaluate, {
      onLeave(retval) {
        retval.replace(0); // errSecSuccess
      }
    });
  }

  if (SecTrustEvaluateWithError) {
    Interceptor.attach(SecTrustEvaluateWithError, {
      onLeave(retval) {
        retval.replace(1); // true
      }
    });
  }
}

function bypassBoringSSL() {
  const SSL_CTX_set_custom_verify = Module.findExportByName(null, 'SSL_CTX_set_custom_verify');
  if (!SSL_CTX_set_custom_verify) return;

  const SSL_VERIFY_NONE = 0;
  Interceptor.attach(SSL_CTX_set_custom_verify, {
    onEnter(args) {
      args[1] = ptr(SSL_VERIFY_NONE);
    }
  });
}

setImmediate(function () {
  bypassSecTrustEvaluate();
  bypassBoringSSL();
  bypassNSURLSession();
  console.log('[破甲] ssl_pinning_bypass.js loaded');
});
