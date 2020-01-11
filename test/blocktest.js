var TXO = require('../index');
const block = require('./block.json');
(async function() {
  for(let i=0; i<block.result.tx.length; i++) { 
    let t = block.result.tx[i];
    let raw = t.hex;
    let result = await TXO.fromTx(raw)
    console.log(JSON.stringify(result, null, 2))
  }
})();
