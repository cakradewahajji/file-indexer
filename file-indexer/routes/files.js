const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
  exec('adb shell ls -R /sdcard/', (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      res.status(500).send('Internal Server Error');
      return;
    }
    if (stderr) {
      console.error(`stderr: ${stderr}`);
      res.status(500).send('Internal Server Error');
      return;
    }

    const output = stdout.split('\n');
    const categorizedFiles = {
      images: [],
      documents: [],
      videos: [],
      messages: [],
      others: []
    };

    let currentPath = '';

    const fileDetailsPromises = [];

    output.forEach(line => {
      if (line.endsWith(':')) {
        currentPath = line.replace(/:$/, '');
      } else if (line.trim() !== '') {
        const filePath = `${currentPath}/${line}`;
        fileDetailsPromises.push(getFileDetails(filePath, categorizedFiles));
      }
    });

    Promise.all(fileDetailsPromises)
      .then(() => {
        console.log('Categorized Files:', categorizedFiles);
        res.json(categorizedFiles);
      })
      .catch(err => {
        console.error(`Error getting file details: ${err}`);
        res.status(500).send('Internal Server Error');
      });
  });
});

function getFileDetails(filePath, categorizedFiles) {
  return new Promise((resolve, reject) => {
    exec(`adb shell stat -c "%y" "${filePath}"`, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        return reject(stderr);
      }

      let timestamp = stdout.trim();

      // Ubah format dari YYYY-MM-DD HH:MM:SS menjadi DD-MM-YY HH-MM-SS
      let [datePart, timePart] = timestamp.split(' ');
      let [year, month, day] = datePart.split('-');
      year = year.substring(2);  // Ambil 2 digit terakhir tahun
      timestamp = `${day}-${month}-${year} ${timePart.replace(/:/g, '-')}`;

      const fileInfo = {
        path: filePath,
        timestamp
      };

      if (filePath.match(/\.(jpg|jpeg|png|gif)$/i)) {
        categorizedFiles.images.push(fileInfo);
      } else if (filePath.match(/\.(pdf|docx|txt)$/i)) {
        categorizedFiles.documents.push(fileInfo);
      } else if (filePath.match(/\.(mp4|mkv|avi)$/i)) {
        categorizedFiles.videos.push(fileInfo);
      } else if (filePath.match(/\.msg$/i)) {
        categorizedFiles.messages.push(fileInfo);
      } else {
        categorizedFiles.others.push(fileInfo);
      }
      resolve();
    });
  });
}

// Endpoint untuk menyajikan file dari perangkat Android
router.get('/file', (req, res) => {
  const filePath = req.query.path;
  const localPath = path.join(__dirname, '..', 'temp', path.basename(filePath));

  exec(`adb pull "${filePath}" "${localPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error pulling file: ${error}`);
      res.status(500).send('Internal Server Error');
      return;
    }
    res.sendFile(localPath);
  });
});

module.exports = router;
