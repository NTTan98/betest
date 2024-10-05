const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;             
// Middleware to parse form data (optional, if sending HTML form data)
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

// Middleware to parse JSON bodies (optional, if sending JSON data)
app.use(express.json());


// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());


// Serve static files (like uploaded images)
app.use('/images', express.static(path.join(__dirname, 'images')));

// Ensure the 'images' directory exists
if (!fs.existsSync('images')) {
    fs.mkdirSync('images');
}

// Configure multer storage (use original filename for now)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/'); // Store uploaded files in the 'images' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  // Use original filename initially
    }
});

// Set up multer with the storage configuration
const upload = multer({ storage: storage }).single('file');  // Single file

// Route to handle file uploads
app.post('/upload', (req, res) => {
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ success: false, message: 'Multer error', error: err.message });
        } else if (err) {
            return res.status(500).json({ success: false, message: 'Unknown error', error: err.message });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        console.log(req.body.newName);
        const uploadedFilePath = path.join(__dirname, 'images', req.file.filename);
        const ext = path.extname(req.file.originalname);
        let newName = req.body.newName ? req.body.newName[0].replace(ext, '') + ext : req.file.filename;

        const newFilePath = path.join(__dirname, 'images', newName);

        // Rename the file if `newName` is provided
        fs.rename(uploadedFilePath, newFilePath, (err) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error renaming file', error: err.message });
            }

            res.json({
                success: true,
                imagePath: `/images/${newName}`,
                fileName: newName
            });
        });
    });
});

// Route to handle file deletions
app.post('/delete', (req, res) => {
    const fileName = req.body.fileName;
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
