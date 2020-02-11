const path = require("path");

const searching = require('../lib');


(async() => {
  const refPath = path.join(__dirname, "reference.PNG");

  const result = await searching(refPath);

  console.log(result);
})();


