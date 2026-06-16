import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const htmlPath = resolve(__dirname, '../public/harshadduhita/index.html');

let html = readFileSync(htmlPath, 'utf8');

html = html.replaceAll('./Harshad Duhita _ TSC_files/', '/harshadduhita/_files/');
html = html.replace(/<base href="[^"]*">\s*/i, '');

const essentialParse =
  '<script>window.viewerModel = JSON.parse(document.getElementById(\'wix-essential-viewer-model\').textContent)</script>';
const essentialPatch = `${essentialParse}
  <link rel="stylesheet" href="/harshadduhita/tsc-wix-bootstrap.css">
  <script src="/harshadduhita/tsc-wix-bootstrap.js"></script>
  <script>window.__tscWixPatchViewerModel && window.__tscWixPatchViewerModel(window.viewerModel)</script>`;

if (html.includes(essentialParse) && !html.includes('tsc-wix-bootstrap.js')) {
  html = html.replace(essentialParse, essentialPatch);
}

const fullParse =
  '<script>window.viewerModel = JSON.parse(document.getElementById(\'wix-viewer-model\').textContent)</script>';
const fullPatch =
  '<script>window.viewerModel = JSON.parse(document.getElementById(\'wix-viewer-model\').textContent); window.__tscWixPatchViewerModel && window.__tscWixPatchViewerModel(window.viewerModel)</script>';

if (html.includes(fullParse) && !html.includes('__tscWixPatchViewerModel(window.viewerModel)</script>')) {
  html = html.replace(fullParse, fullPatch);
}

html = html.replace(
  '<script crossorigin="" defer="" onload="resolveExternalsRegistryModule(&#39;reactDOM&#39;)" src="/harshadduhita/_files/react-dom.production.min.js"></script>',
  '<script crossorigin="" onload="resolveExternalsRegistryModule(&#39;reactDOM&#39;)" src="/harshadduhita/_files/react-dom.production.min.js"></script>',
);

html = html.replace(
  '<script async="" src="/harshadduhita/_files/main.91ac3227.bundle.min.js"></script>',
  '<script defer="" src="/harshadduhita/_files/main.91ac3227.bundle.min.js"></script>',
);
html = html.replace(
  '<script async="" src="/harshadduhita/_files/main.renderer.99fa8096.bundle.min.js"></script>',
  '<script defer="" src="/harshadduhita/_files/main.renderer.99fa8096.bundle.min.js"></script>',
);

if (!html.includes('tsc-suppress-wix-ads')) {
  html = html.replace(
    '</body></html>',
    `<script id="tsc-suppress-wix-ads">
(function(){
  function kill(){
    document.querySelectorAll('#WIX_ADS,.WIX_ADS,.ub230c,[data-hook="freemium-banner"]').forEach(function(el){el.remove();});
    document.documentElement.style.setProperty('--wix-ads-height','0px');
    var root=document.getElementById('site-root');
    if(root) root.style.top='0';
  }
  kill();
  new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
})();
</script>
</body></html>`,
  );
}

writeFileSync(htmlPath, html);
console.log('patched', htmlPath, 'bytes:', html.length);
