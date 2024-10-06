const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config(); // Load environment variables
const cors = require('cors');  // Import cors

const app = express();
const port = 4000;

// Use CORS middleware for all routes
app.use(cors({
    origin: '*',  // Allow all origins (for development/testing only)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Set up Google Drive authentication (OAuth2)
const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,        // Use environment variable for Google Client ID
    process.env.CLIENT_SECRET,    // Use environment variable for Google Client Secret
    process.env.REDIRECT_URI      // Your Redirect URI (if applicable)
);

// Set refresh token to avoid re-authenticating each time
oauth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN, // Use environment variable for Google Refresh Token
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

//using listhFile show image on fronent
app.get('/images-list', async (req, res) => {
    try {
        const response = await drive.files.list({
            q: `'${process.env.DRIVE_FOLDER_ID}' in parents and mimeType = 'image/jpeg'`,
            pageSize: 10,
            fields: 'nextPageToken, files(id, name)',
        });
        const files = response.data.files;
        if (files.length === 0) {
            console.log('No files found.');
        } else {
            const images = files.map((file) => ({ name: file.name, src: `https://drive.google.com/uc?id=${file.id}` }));
            res.send(images);
        }
    } catch (error) {
        console.log(error);
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});