const PNGReader = require('png.js');
const Promise = require('bluebird');

class ImageDecoder {
  /**
   * Convertir imagen a formato de píxeles (PNGReader)
   * @param {Buffer} imgBuf, imagen que será convertida
   * @returns {Object: <{png: PNGReader, buf: Buffer}>}
   */
  static async decode(imgBuf) {
    const reader = new PNGReader(imgBuf);

    return new Promise((resolve, reject) => {
      reader.parse((err, png) => {
        if (err) {
          return reject(err);
        }

        return resolve({ png, buf: imgBuf });
      });
    });
  }
}

module.exports = ImageDecoder;
