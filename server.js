const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
// Middleware to parse form data (optional, if sending HTML form data)
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies (optional, if sending JSON data)
app.use(express.json());

const port = 3000;

// Serve static files (like uploaded images)
app.use('/images', express.static(path.join(__dirname, 'images')));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'images/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);  // Get the original extension
        let newName = req.body.newName || file.originalname;  // Use the provided name or fallback to original

        // Ensure the new name does not have the extension already
        newName = newName.replace(ext, '') + ext;

        cb(null, newName);  // Store the file with the new name
    }
});

const upload = multer({ storage: storage });

// Ensure the images directory exists
if (!fs.existsSync('images')) {
    fs.mkdirSync('images');
}

// Route to handle file uploads
app.post('/upload', (req, res) => {
    // Use `upload.single('image')` here to process the file
    upload.single('image')(req, res, function (err) {
        if (err) {
            return res.status(500).json({ success: false, message: 'File upload failed', error: err });
        }

        if (!req.file) {
            return res.json({ success: false, message: 'No file uploaded' });
        }

        console.log('New Name from form:', req.body.newName); // Now req.body.newName is accessible

        res.json({
            success: true,
            imagePath: `/images/${req.file.filename}`,  // Return the new path to the uploaded image
            fileName: req.file.filename,  // Return the new file name
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
