import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { generateTokens, User } from '../models/User.js';

export const configureGoogleStrategy = () => {
  passport.use(
    new GoogleStrategy(
      {
        /* eslint no-undef: off */
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,

        proxy: true,
        state: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email =
            profile.emails && profile.emails.length > 0
              ? profile.emails[0].value
              : null;

          if (!email) {
            return done(new Error('No email found in Google profile'));
          }

          let user = await User.findOne({
            email: email,
            provider: 'google',
          });

          if (!user) {
            user = new User({
              firstName: profile.name.givenName || 'firstName',
              lastName: profile.name.familyName || 'lastName',
              email: email,
              provider: 'google',
              isConfirmed: true,
              profilePic:
                profile.photos && profile.photos.length > 0
                  ? {
                      secure_url: profile.photos[0].value,
                      public_id: null,
                    }
                  : null,

              gender: 'Male', // Default, as Google doesn't always provide this
              DOB: new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000), // Default to 18 years ago
              mobileNumber: null,
            });

            await user.save();
          }
          // Attach tokens to the user object
          const { accessToken: token, refreshToken: refresh } =
            generateTokens(user);
          user.accessToken = () => token;
          user.refreshToken = () => refresh;
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      },
    ),
  );
};

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, false);
  }
});
