const fs = require('fs');
const https = require('https');
const path = require('path');

const EPHE_DIR = path.join(__dirname, 'public', 'ephe');
const FILES = ['sepl_18.se1', 'semo_18.se1'];
const BASE_URL = 'https://raw.githubusercontent.com/aloistr/swisseph/master/ephe/';

if (!fs.existsSync(EPHE_DIR)) {
  fs.mkdirSync(EPHE_DIR, { recursive: true });
}

function downloadFile(fileName) {
  const filePath = path.join(EPHE_DIR, fileName);
  const file = fs.createWriteStream(filePath);

  console.log(`Downloading ${fileName}...`);
  https.get(`${BASE_URL}${fileName}`, (response) => {
    if (response.statusCode !== 200) {
      console.error(`Failed to download ${fileName}: ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log(`Successfully downloaded ${fileName}`);
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`Error downloading ${fileName}: ${err.message}`);
  });
}

FILES.forEach(downloadFile);
