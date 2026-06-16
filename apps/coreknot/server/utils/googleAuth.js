const { google } = require('googleapis');
const { resolveApiBaseUrl, resolveOAuthRedirectUri } = require('./oauthEnv');

const CALLBACK_PATH = '/api/auth/google/callback';

const trimEnv = (value) => String(value || '').trim();

/** True when staff Google OAuth can run (both client id + secret set). */
const isGoogleOAuthConfigured = () => (
  Boolean(trimEnv(process.env.GOOGLE_CLIENT_ID))
  && Boolean(trimEnv(process.env.GOOGLE_CLIENT_SECRET))
);

const resolveGoogleRedirectUri = (req) => resolveOAuthRedirectUri(req, {
  envVar: 'GOOGLE_REDIRECT_URI',
  path: CALLBACK_PATH,
});

const createOAuth2Client = (redirectUri) => {
  const resolved = redirectUri || resolveGoogleRedirectUri();
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    resolved,
  );
};

const getCalendar = (auth) => {
  return google.calendar({ version: 'v3', auth });
};

const getDrive = (auth) => {
  return google.drive({ version: 'v3', auth });
};

const getSearchConsole = (auth) => {
  return google.searchconsole({ version: 'v1', auth });
};

module.exports = {
  CALLBACK_PATH,
  isGoogleOAuthConfigured,
  resolveGoogleRedirectUri,
  createOAuth2Client,
  getCalendar,
  getDrive,
  getSearchConsole,
};
