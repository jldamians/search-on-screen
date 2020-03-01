const desktop = require('screenshot-desktop');

const ImageDecoder = require('./ImageDecoder');

class Screenshot {
  static async take() {
    const buf = await desktop({ format: 'png' });

    const png = await ImageDecoder.decode(buf);

    return png;
  }
}

module.exports = Screenshot;
