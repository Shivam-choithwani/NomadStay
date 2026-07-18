const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");
const { generateAccessToken, generateRefreshToken } = require("./generateTokens");

// Google OAuth 2.0 strategy — called when Google redirects back to our callback URL
// after the user consents.  We find-or-create a User, then generate JWTs.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find an existing user with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          // Check if a user already registered with the same email via local auth
          const email = profile.emails?.[0]?.value;
          if (email) {
            user = await User.findOne({ email });
            if (user) {
              // Link the Google account to the existing local-auth user
              user.googleId = profile.id;
              user.isEmailVerified = true; // Google has already verified this email
              if (!user.avatarUrl && profile.photos?.[0]?.value) {
                user.avatarUrl = profile.photos[0].value;
              }
              await user.save();
              return done(null, user);
            }
          }

          // Brand-new user — create account from Google profile
          user = await User.create({
            name: profile.displayName,
            email,
            googleId: profile.id,
            authProvider: "google",
            avatarUrl: profile.photos?.[0]?.value || "",
            isEmailVerified: true, // Google-verified email
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

module.exports = passport;
