const sharp = require('sharp');

async function cleanLogo() {
  try {
    const inputPath = 'public/logo.jpg';
    const outputPath = 'public/logo.png';
    
    // Extract greyscale and remove JPEG artifacts by subtracting brightness
    const { data, info } = await sharp(inputPath)
      .greyscale()
      .linear(1.5, -40) // Substracts 40 to kill dark artifacts, multiplies by 1.5 to keep whites bright
      .raw()
      .toBuffer({ resolveWithObject: true });
      
    await sharp({
      create: {
        width: info.width,
        height: info.height,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .joinChannel(data, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 1
      }
    })
    .trim()
    .png()
    .toFile(outputPath);
    console.log("Logo cleaned successfully.");
  } catch(e) {
    console.error(e);
  }
}
cleanLogo();
