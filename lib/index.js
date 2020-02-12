const fs = require('fs');
const PNG = require('png.js');
const Promise = require('bluebird');
const desktop = require('screenshot-desktop');

/**
 * Busca en la pantalla la primera fila de pixeles de la imagen de referencia
 * @param {PNGReader} screenshot, imagen de la captura de pantalla
 * @param {PNGReader} reference, imagen que buscaremos en la pantalla (referencia)
 * @param {object: {x, y}} position, posición en pantalla desde donde se iniciará la búsqueda
 * @returns {boolean: true|false}
 */
function findFirstRow(screenshot, reference, position = { x: 0, y: 0 }) {
  // dada la posición inical en pantalla, nos aseguramos
  // que la búsqueda de la referencia se realize dentro de
  // los margenes de la pantalla (ancho)
  const isWithinRange = position.x + reference.width < screenshot.width;

  if (!isWithinRange) {
    return false;
  }

  // contador de pixeles que coinciden únicamente a lo
  // largo de la primera fila de la imagen de referencia
  let counter = 0;

  for (let x = 0; x < reference.width; x += 1) {
    const newScreenshotPixel = screenshot.getPixel(position.x + x, position.y);
    const newReferencePixel = reference.getPixel(x, 0);

    if (newScreenshotPixel.join('') !== newReferencePixel.join('')) {
      break;
    }

    counter += 1;
  }

  // verificamos si todos los píxeles de la primera fila
  // de la img de ref, han sido encontrados en la pantalla
  if (reference.width === counter) {
    return true;
  }

  return false;
}

/**
 * Busca la referencia desde una posición (punto) en la pantalla
 * @param {PNGReader} screenshot, imagen de la captura de pantalla
 * @param {PNGReader} reference, imagen que buscaremos en la pantalla (referencia)
 * @param {object: {x, y}} position, posición en pantalla desde donde se iniciará la búsqueda
 * @returns {boolean: true|false}
 */
function findReference(screenshot, reference, position = { x: 0, y: 0 }) {
  // dada la posición inical en pantalla, nos aseguramos
  // que la búsqueda de la referencia se realize dentro de
  // los margenes de la pantalla (ancho y alto)
  const isWithinWidth = (
    position.x + reference.width < screenshot.width
  );
  const isWithinHeight = (
    position.y + reference.height < screenshot.height
  );
  const isWithinRange = isWithinWidth && isWithinHeight;

  if (!isWithinRange) {
    return false;
  }

  // contador de pixeles que coinciden a lo
  // largo y alto de la imagen de referencia
  let counter = 0;

  for (let x = 0; x < reference.width; x += 1) {
    // esta variable nos permitirá terminar el bucle principal
    let breaking = false;

    for (let y = 0; y < reference.height; y += 1) {
      const newScreenshotPixel = screenshot.getPixel(position.x + x, position.y + y);
      const newReferencePixel = reference.getPixel(x, y);

      if (newScreenshotPixel.join('') !== newReferencePixel.join('')) {
        breaking = true;

        break;
      }

      counter += 1;
    }

    // validamos si debemos terminar el bucle principal
    if (breaking === true) {
      break;
    }
  }

  // verificamos si los píxeles de la img de ref,
  // han sido encontrados en la pantalla
  if (counter === reference.width * reference.height) {
    return true;
  }

  return false;
}

/**
 * Obtener pixeles de la imagen de referencia
 * @param {string|buffer} image, imagen que buscaremos en la pantalla (referencia)
 * @returns {object: {png: PNGReader, buffer: Buffer}}
 */
function getReference(image) {
  let imgBuf;

  if (typeof image === 'string') {
    imgBuf = fs.readFileSync(image);
  } else {
    imgBuf = image;
  }

  const reader = new PNG(imgBuf);

  return new Promise((resolve, reject) => {
    reader.parse((error, png) => {
      if (error) {
        return reject(error);
      }

      return resolve({ png, buffer: imgBuf });
    });
  });
}

/**
 * Obtener pixeles de la captura de pantalla
 * @returns {object: {png: PNGReader, buffer: Buffer}}
 */
function getScreenshot() {
  return desktop({ format: 'png' }).then((buf) => {
    const reader = new PNG(buf);

    return new Promise((resolve, reject) => {
      reader.parse((error, png) => {
        if (error) {
          return reject(error);
        }

        return resolve({ png, buffer: buf });
      });
    });
  });
}

/**
 * Buscamos la imagen de referencia en la pantalla
 * @param {PNGReader} screenshot, imagen de la captura de pantalla
 * @param {PNGReader} reference, imagen que buscaremos en la pantalla (referencia)
 * @param {object<optional>: {x, y}} initPos, posición donde iniciará la búsqueda
 * @returns {boolean: true|false}
 */
function matching(screenshot, reference, initPos = null) {
  let position = null;

  if (initPos) {
    if (findFirstRow(screenshot, reference, initPos) === true) {
      if (findReference(screenshot, reference, initPos) === true) {
        return initPos;
      }
    }
  }

  const firstRefPixel = reference.getPixel(0, 0);
  const lastRefPixel = reference.getPixel(reference.width - 1, reference.height - 1);

  for (let x = 0; x < screenshot.width - reference.width; x += 1) {
    // esta variable nos permitirá terminar el bucle principal
    let breaking = false;

    for (let y = 0; y < screenshot.height - reference.height; y += 1) {
      const newCurrentScreenPosition = { x, y };
      const newFirstPixel = screenshot.getPixel(x, y);
      const newLastPixel = screenshot.getPixel(reference.width + x - 1, reference.height + y - 1);

      const firstPixelMatch = (
        firstRefPixel.join('') === newFirstPixel.join('')
      );

      const lastPixelMatch = (
        lastRefPixel.join('') === newLastPixel.join('')
      );

      // evaluamos si el primer pixel del la referencia
      // es igual a la posición actual del recorrido
      if (firstPixelMatch === true && lastPixelMatch === true) {
        if (findFirstRow(screenshot, reference, newCurrentScreenPosition) === true) {
          if (findReference(screenshot, reference, newCurrentScreenPosition) === true) {
            breaking = true;

            position = newCurrentScreenPosition;

            break;
          }
        }
      }
    }

    // validamos si debemos terminar el bucle principal
    if (breaking === true) {
      break;
    }
  }

  return position;
}

/**
 * @param {string|buffer} imgRef, imagen que buscaremos en la pantalla
 * @param {object<optional>: {x, y}} initPos, posición donde iniciará la búsqueda
 * @returns {object: {x, y}}
 */
async function recognize(imgRef, initPos = null) {
  const reference = await getReference(imgRef);

  const screenshot = await getScreenshot();

  const position = matching(screenshot.png, reference.png, initPos);

  return {
    position,
    reference: {
      size: {
        width: reference.png.width,
        height: reference.png.height,
      },
      buffer: reference.buffer,
    },
    screenshot: {
      size: {
        width: reference.png.width,
        height: reference.png.height,
      },
      buffer: screenshot.buffer,
    },
  };
}

module.exports = recognize;
