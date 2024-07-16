const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = process.env.PORT || 3000;

// Secret key for JWT
const SECRET_KEY = process.env.SECRET_KEY || 'default_secret_key';


app.use(cors());
app.use(express.json());

const leaderboard = [

];

// Middleware to verify token
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(403);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/leaderboard', (req, res) => {
    res.json(leaderboard.sort((a, b) => b.score - a.score));
});

app.post('/add-user', authenticateToken, (req, res) => {
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
