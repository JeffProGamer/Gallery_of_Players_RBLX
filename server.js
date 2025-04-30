const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.json());

// Load uploads
let uploads = [];
if (fs.existsSync('uploads.json')) {
    uploads = JSON.parse(fs.readFileSync('uploads.json'));
}

// Upload endpoint
app.post('/upload', async (req, res) => {
    const { playerName, userId, time } = req.body;
    const captureId = Date.now();

    // Save info
    const newUpload = {
        id: captureId,
        playerName,
        userId,
        time
    };
    uploads.push(newUpload);
    fs.writeFileSync('uploads.json', JSON.stringify(uploads, null, 2));

    // Download avatar if not already downloaded
    const avatarPath = `public/avatars/${userId}.png`;
    if (!fs.existsSync(avatarPath)) {
        try {
            const response = await axios({
                url: `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`,
                responseType: 'json'
            });

            const imgUrl = response.data.data[0].imageUrl;
            const imgRes = await axios.get(imgUrl, { responseType: 'stream' });

            imgRes.data.pipe(fs.createWriteStream(avatarPath));
        } catch (error) {
            console.error('Failed to fetch avatar:', error);
        }
    }

    res.send({ success: true });
});

// Gallery page
app.get('/', (req, res) => {
    res.render('index', { uploads });
});

app.listen(PORT, () => {
    console.log(`Gallery is running on http://localhost:${PORT}`);
});
