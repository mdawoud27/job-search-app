import { OAuth2Client } from 'google-auth-library';

export const googleVerifyIdToken = async (idToken) => {
  /* eslint no-undef: off */
  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket;
  } catch (error) {
    throw new Error(`Invalid Google ID Token: ${error.message}`);
  }
};
