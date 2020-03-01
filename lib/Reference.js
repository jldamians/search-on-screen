const fs = require('fs');

const ImageDecoder = require('./ImageDecoder');

class Reference {
  static async decode(img) {
    let buf;

    if (typeof img === 'string') {
      buf = fs.readFileSync(img);
    } else {
      buf = img;
    }

    const png = await ImageDecoder.decode(buf);

    return png;
  }
}

module.exports = Reference;
