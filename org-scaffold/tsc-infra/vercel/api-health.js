export default function handler(_req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'tsc-coreknot',
    timestamp: new Date().toISOString(),
  });
}
