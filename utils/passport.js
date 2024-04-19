const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth2").Strategy;

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

// Facebook authentication strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FCLIENT_ID,
    clientSecret: process.env.FCLIENT_SECRET,
    callbackURL: "http://localhost:3000/user/auth/facebook/callback",
    passReqToCallback: true
}, (request, accessToken, refreshToken, profile, done) => {
   
    return done(null, profile);
}));

// Google authentication strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GCLIENT_ID,
    clientSecret: process.env.GCLIENT_SECRET,
    callbackURL: "http://localhost:3000/user/auth/google/callback",
    passReqToCallback: true
}, (request, accessToken, refreshToken, profile, done) => {
    const userName = profile.displayName;
    console.log(userName);
    return done(null, profile);
}));
