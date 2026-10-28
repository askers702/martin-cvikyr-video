const sharp = require('sharp');

async function trimLogo() {
  try {
    const inputPath = 'public/logo.png';
    const outputPath = 'public/logo-trimmed.png';
    
    await sharp(inputPath)
      .trim()
      .toFile(outputPath);
      
    console.log("Trimmed logo successfully.");
  } catch (err) {
    console.error(err);
  }
}

trimLogo();
