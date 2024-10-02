const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Set up body parser to handle form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (like uploaded images)
app.use('/images', express.static(path.join(__dirname, 'images')));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const newName = req.body.newName ? req.body.newName + ext : file.originalname;
        cb(null, newName);
    }
});

const upload = multer({ storage: storage });

// Ensure the images directory exists
if (!fs.existsSync('images')) {
    fs.mkdirSync('images');
}

// Route to handle file uploads
app.post('/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.json({ success: false, message: 'No file uploaded' });
    }

    res.json({
        success: true,
        imagePath: `/images/${req.file.filename}`,
        fileName: req.file.filename,
    });
});

// Route to handle file deletions
app.post('/delete', (req, res) => {
    const fileName = req.body.file;
    const filePath = path.join(__dirname, 'images', fileName);

    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
            if (err) {
                return res.json({ success: false, message: 'Error deleting file' });
            }
            res.json({ success: true, message: `File ${fileName} deleted.` });
        });
    } else {
        res.json({ success: false, message: 'File not found' });
    }
});

// Route to get the list of uploaded images
app.get('/images-list', (req, res) => {
    const imageDir = path.join(__dirname, 'images');
    
    fs.readdir(imageDir, (err, files) => {
        if (err) {
            return res.json({ success: false, message: 'Unable to scan images directory' });
        }
        
        const images = files.filter(file => ['.jpg', '.jpeg', '.png', '.gif'].includes(path.extname(file).toLowerCase()));
        res.json({ success: true, images });
    });
});

// Serve the HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
