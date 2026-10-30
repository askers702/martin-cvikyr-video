const sharp = require('sharp');

async function processLogo() {
  try {
    const inputPath = 'public/logo-new.png';
    const outputPath = 'public/logo.png';

    const image = sharp(inputPath);
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

    // Output buffer: 4 channels (RGBA)
    const outBuffer = Buffer.alloc(info.width * info.height * 4);

    const darkThreshold = 26; // Background is around 18-22
    const solidThreshold = 105; // Full opacity threshold

    for (let i = 0, j = 0; i < data.length; i += info.channels, j += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      let alpha = 0;
      if (lum <= darkThreshold) {
        alpha = 0;
      } else if (lum >= solidThreshold) {
        alpha = 255;
      } else {
        // Smooth curve with slight boost to anti-aliased edge visibility
        const norm = (lum - darkThreshold) / (solidThreshold - darkThreshold);
        alpha = Math.min(255, Math.round(255 * Math.pow(norm, 0.8)));
      }

      // Pure crisp white
      outBuffer[j] = 255;     // R
      outBuffer[j + 1] = 255; // G
      outBuffer[j + 2] = 255; // B
      outBuffer[j + 3] = alpha;
    }

    // Now save with sharp and trim transparent borders
    await sharp(outBuffer, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .trim()
    .png()
    .toFile(outputPath);

    const trimmedMeta = await sharp(outputPath).metadata();
    console.log('Successfully created trimmed transparent logo:', trimmedMeta.width, 'x', trimmedMeta.height);
  } catch (err) {
    console.error('Error processing logo:', err);
  }
}

processLogo();
