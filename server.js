const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');
const app = express();
const PORT = process.env.PORT || 3000;

// AWS configuration
const secretsManager = new AWS.SecretsManager({
    region: 'us-east-1' // N. Virginia region
});

// Function to retrieve the secret key from AWS Secrets Manager
async function getSecretKey(secretName) {
    try {
        const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
        if ('SecretString' in data) {
            return JSON.parse(data.SecretString).SECRET_KEY;
        }
    } catch (err) {
        console.error('Error retrieving secret key:', err);
        throw new Error('Could not retrieve secret key');
    }
}

// Middleware to verify token
function authenticateToken(secretKey) {
    return (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token) return res.sendStatus(403);

        jwt.verify(token, secretKey, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    };
}

(async () => {
    // Retrieve the secret key from AWS Secrets Manager
    const SECRET_KEY = await getSecretKey('myapp/secret_key') || 'default_secret_key';

    app.use(cors());
    app.use(express.json());

    const leaderboard = [];

    app.get('/leaderboard', (req, res) => {
        res.json(leaderboard.sort((a, b) => b.score - a.score));
    });

    app.post('/add-user', authenticateToken(SECRET_KEY), (req, res) => {
        const { name, score } = req.body;
        if (name && score) {
            leaderboard.push({ name, score: parseInt(score, 10) });
            res.status(200).send('User added successfully');
        } else {
            res.status(400).send('Name and score are required');
        }
    });

    app.get('/', (req, res) => {
        res.send('Server is running');
    });

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
})();
