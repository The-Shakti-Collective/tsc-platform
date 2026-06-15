import type { NextApiRequest, NextApiResponse } from 'next';

const EXPECTED_COMMIT = '044eb5b';
const AMBASSADOR_PATH = '/tscacademy/ambassador';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const deployedSha = process.env.VERCEL_GIT_COMMIT_SHA || null;
  const deployedRef = process.env.VERCEL_GIT_COMMIT_REF || null;
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID || null;
  const isVercel = Boolean(process.env.VERCEL);
  const ambassadorDeployed = Boolean(deployedSha?.startsWith(EXPECTED_COMMIT));

  const payload = {
    ok: true,
    host: 'theshakticollective.in',
    expectedCommitPrefix: EXPECTED_COMMIT,
    deployedSha,
    deployedRef,
    deploymentId,
    isVercel,
    ambassadorPath: AMBASSADOR_PATH,
    ambassadorDeployed,
    hint: !isVercel
      ? 'Running locally — production check must hit deployed URL.'
      : !deployedSha?.startsWith(EXPECTED_COMMIT)
        ? 'Production is behind GitHub main. Redeploy from Vercel or enable deploy hook workflow.'
        : 'Deployment matches latest ambassador commit.',
  };

  // #region agent log
  fetch('http://127.0.0.1:7894/ingest/3b11e0a0-55d0-4a0a-9e16-915d6021d643', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '0e81ca' },
    body: JSON.stringify({
      sessionId: '0e81ca',
      runId: 'deploy-check',
      hypothesisId: 'H1-H3',
      location: 'pages/api/deployment-status.ts',
      message: 'deployment-status queried',
      data: {
        deployedSha,
        deployedRef,
        deploymentId,
        isVercel,
        ambassadorDeployed,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(payload);
}
