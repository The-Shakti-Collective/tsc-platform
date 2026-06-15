const http = require('http');
const { config } = require('../config');

let workerReady = false;
let healthServer = null;

function setWorkerReady(ready) {
  workerReady = Boolean(ready);
}

function startWorkerHealthServer() {
  if (healthServer) return healthServer;

  healthServer = http.createServer((req, res) => {
    const path = (req.url || '').split('?')[0];
    if (path === '/api/health/ready' || path === '/api/health/live' || path === '/api/health') {
      const ready = workerReady;
      const payload = {
        ok: ready,
        ready,
        status: ready ? 'HEALTHY' : 'STARTING',
        service: 'coreknot-worker',
      };
      res.writeHead(ready ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(payload));
      return;
    }
    res.writeHead(404).end();
  });

  healthServer.listen(config.PORT, () => {
    console.log(`[workers] Health server listening on :${config.PORT}`);
  });

  return healthServer;
}

async function closeWorkerHealthServer() {
  if (!healthServer) return;
  await new Promise((resolve) => {
    healthServer.close(() => resolve());
  });
  healthServer = null;
}

module.exports = {
  startWorkerHealthServer,
  setWorkerReady,
  closeWorkerHealthServer,
};
