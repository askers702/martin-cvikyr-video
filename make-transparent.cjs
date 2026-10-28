const sharp = require('sharp');

async function convert() {
  try {
    const inputPath = 'public/logo.jpg';
    const outputPath = 'public/logo.png';
    
    // Get the image as a single-channel greyscale buffer
    const { data, info } = await sharp(inputPath)
      .greyscale()
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
    .png()
    .toFile(outputPath);
    
    console.log("Converted logo successfully.");
  } catch (err) {
    console.error(err);
  }
}

convert();
