const pQueue = require('p-queue')
const TXO = require('../index');
const queue = new pQueue({concurrency: 3})
const fun = async function(hash) {
  let o = await TXO.fromHash(hash, true)
  return o
}
for(let i=0;i<10; i++) {
  console.log("adding", i)
  queue.add(async function() {
    console.log("Finished", i)
    let hash = "15c6113bb1ecddc976131022bc80f46684d8956ab1a7bb5fc5625b5f7a930438"
    let res = await fun(hash).catch(function(e) {
      console.log("## Error = ", e)
    })
    console.log("### result = ", res)
  })
}
