
const https = require('https');
const fs = require('fs');

const url = 'https://www.datos.gov.co/resource/ixig-z8b5.json?tipo=Urbano&$limit=5000';
const file = fs.createWriteStream("colombia_raw_data.json");

console.log(`Downloading from ${url}...`);

https.get(url, function (response) {
    response.pipe(file);
    file.on('finish', function () {
        file.close(() => {
            console.log("Download completed.");
            const stats = fs.statSync("colombia_raw_data.json");
            console.log(`File size: ${stats.size} bytes`);
        });
    });
}).on('error', function (err) {
    console.error("Error downloading:", err.message);
});
