import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

export const configurePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        /* eslint no-undef: off */
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL_1 ||
          process.env.GOOGLE_CALLBACK_URL_2,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Extract user info
          const email = profile.emails[0].value;
          const googleId = profile.id;
          const displayName = profile.displayName;
          const profilePic = profile.photos[0]?.value || null;

          // Parse name from displayName
          const nameParts = displayName.split(' ');
          const firstName = nameParts[0] || displayName;
          const lastName = nameParts.slice(1).join(' ') || displayName;

          // Check if user exists with Google ID
          let user = await User.findOne({ googleId });

          if (user) {
            return done(null, user);
          }

          // Check if user exists with email
          user = await User.findOne({ email });

          if (user) {
            // Link Google account
            user.googleId = googleId;
            user.provider = 'google';
            user.name = user.name || displayName;
            user.profilePic = user.profilePic || profilePic;
            user.isConfirmed = true;

            await user.save();
            return done(null, user);
          }

          user = await User.create({
            email,
            googleId,
            name: displayName,
            firstName,
            lastName,
            profilePic: profilePic ? { url: profilePic } : null,
            provider: 'google',
            isConfirmed: true,
            DOB: null,
            gender: null,
            profileComplete: false,
          });

          return done(null, user);
        } catch (error) {
          return done(error, null);
        }
      },
    ),
  );

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};
