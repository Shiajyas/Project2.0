const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const rimraf = require('rimraf');

const FILE_TYPE_MAP = {
  'image/png': 'png',
  'image/jpeg': 'jpeg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './public/productImages');
  },
  filename: (req, file, cb) => {
    console.log(file);
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Schedule the image cleanup task every day at a specific time (adjust the cron expression as needed)
cron.schedule('0 0 * * *', () => {
  cleanupOldImages('./public/productImages');
  console.log('Image cleanup task executed');
}, {
  timezone: 'Asia/Kolkata' // Adjust to your timezone
});

function cleanupOldImages(folderPath) {
  // Calculate the date one day ago
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  // Read the content of the folder
  fs.readdir(folderPath, (err, files) => {
    if (err) {
      console.error(`Error reading folder: ${err}`);
      return;
    }

    // Iterate through each file in the folder
    files.forEach(file => {
      const filePath = path.join(folderPath, file);

      // Get the file stats
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error(`Error getting file stats: ${err}`);
          return;
        }

        // Check if the file is older than one day
        if (stats.isFile() && stats.ctime < oneDayAgo) {
          // Use rimraf to remove the file
          rimraf(filePath, (err) => {
            if (err) {
              console.error(`Error removing file: ${err}`);
            } else {
              console.log(`Removed old file: ${filePath}`);
            }
          });
        }
      });
    });
  });
}

// Export both functions
module.exports = {
  upload,
  cleanupOldImages
};
