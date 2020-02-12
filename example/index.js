const path = require('path');
const searching = require('../lib');

(async() => {
  const starting = new Date().getTime();
  const refPath = path.join(__dirname, "reference.PNG");
  const result = await searching(refPath);
  const ending = new Date().getTime();

  if (!result.position) {
    console.log('La imagen de referencia no fue encontrada');
  } else {
    console.log(`Imagen encontrada en la posición (${result.position.x}, ${result.position.y})`);
  }

  console.log(`Time: ${(ending - starting) / 1000} seconds`);
})();
