(function () {
  'use strict';

  var IS_WIX_HOST = /wixstudio\.com|wixsite\.com|editorx\.com/i.test(location.hostname);
  var IS_OFF_DOMAIN = !IS_WIX_HOST;

  if (IS_OFF_DOMAIN) {
    document.documentElement.classList.add('tsc-wix-offdomain');
  }

  function patchViewerModel(vm) {
    if (!vm || !IS_OFF_DOMAIN) return vm;

    try {
      if (vm.experiments) {
        vm.experiments['specs.thunderbolt.hardenFetchAndXHR'] = false;
        vm.experiments['specs.thunderbolt.securityExperiments'] = false;
      }
      if (vm.siteFeaturesConfigs && vm.siteFeaturesConfigs.sessionManager) {
        vm.siteFeaturesConfigs.sessionManager.isRunningInDifferentSiteContext = true;
      }
      vm.requestUrl = location.href.split('#')[0];
      if (vm.site) {
        vm.site.externalBaseUrl = location.origin;
      }
    } catch (err) {
      console.warn('[tsc-wix-bootstrap] viewerModel patch failed', err);
    }

    return vm;
  }

  window.__tscWixPatchViewerModel = patchViewerModel;

  function wixMediaUrl(uri) {
    if (!uri) return '';
    if (/^https?:\/\//i.test(uri)) return uri;
    return 'https://static.wixstatic.com/media/' + uri.replace(/^\//, '');
  }

  function polyfillWowImages() {
    document.querySelectorAll('wow-image[data-image-info]').forEach(function (el) {
      if (el.querySelector('img')) return;

      var raw = el.getAttribute('data-image-info');
      if (!raw) return;

      try {
        var info = JSON.parse(raw);
        var data = info.imageData || info;
        var uri = data.uri || info.uri;
        if (!uri) return;

        var img = document.createElement('img');
        img.src = wixMediaUrl(uri);
        img.alt = data.alt || info.alt || '';
        img.loading = 'lazy';
        img.decoding = 'async';
        img.setAttribute('data-load-done', '');
        el.appendChild(img);
      } catch (err) {
        /* ignore malformed image payloads */
      }
    });

    document.querySelectorAll('.X9nqm0, wow-image').forEach(function (el) {
      el.style.opacity = '1';
    });
  }

  function revealPage() {
    document.body.setAttribute('data-js-loaded', '');
    document.documentElement.classList.add('tsc-wix-ready');
    document.querySelectorAll('[data-hide-prejs]').forEach(function (el) {
      el.style.visibility = 'visible';
    });
    polyfillWowImages();
  }

  function patchFedops() {
    if (!IS_OFF_DOMAIN) return;
    var node = document.getElementById('wix-fedops');
    if (!node) return;
    try {
      var payload = JSON.parse(node.textContent);
      if (payload.data) {
        payload.data.requestUrl = location.href.split('#')[0];
        if (payload.data.site) {
          payload.data.site.externalBaseUrl = location.origin;
        }
        node.textContent = JSON.stringify(payload);
        window.fedops = payload;
      }
    } catch (err) {
      console.warn('[tsc-wix-bootstrap] fedops patch failed', err);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      patchFedops();
      polyfillWowImages();
    });
  } else {
    patchFedops();
    polyfillWowImages();
  }

  window.addEventListener('load', function () {
    polyfillWowImages();
    if (IS_OFF_DOMAIN) {
      setTimeout(revealPage, 1200);
    }
  });

  if (IS_OFF_DOMAIN) {
    setTimeout(revealPage, 3500);
  }
})();
