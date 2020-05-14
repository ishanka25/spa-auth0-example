require('dotenv').config();
const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');

const { join } = require("path");

const port = process.env.PORT;
const domain = process.env.DOMAIN;
const clientId = process.env.CLIENT_ID;
const audience = process.env.AUDIENCE;

// Serve static assets from the app/public folder
app.use(express.static(join(__dirname, "app/public")));

// Endpoint to serve the configuration file
app.get("/auth_config", (req, res) => {
    res.json({
        "domain": domain,
        "clientId": clientId,
        "audience": audience
    });
});

// Serve the index page
app.get("/", (_, res) => {
    res.sendFile(join(__dirname, "app/index.html"));
});

// Authentication middleware
const checkJwt = jwt({
    // Dynamically provide a signing key
    // based on the kid in the header and 
    // the signing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://${domain}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: audience,
    issuer: `https://${domain}/`,
    algorithms: ['RS256']
});

// This route doesn't need authentication
app.get('/api/public', function(req, res) {
    res.json({
        message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
    });
});

// This route needs authentication
app.get('/api/private', checkJwt, function(req, res) {
    res.json({
        message: 'Hello from a private endpoint! You need to be authenticated to see this.',
        user: req.user
    });
});

// This route needs authentication with a specific scope
app.get('/api/private-scoped', checkJwt, jwtAuthz(['read:messages']), function(req, res) {
    res.json({
        message: 'Hello from a private scoped endpoint! You need to be authenticated and have a scope of read:messages to see this.'
    });
});

// Error handler
app.use(function(err, req, res, next) {
    if (err.name === "UnauthorizedError") {
        return res.status(401).send({ message: "Invalid token" });
    }

    next(err, req, res);
});

app.listen(port, () => console.log(`App is listening at http://localhost:${port}`))