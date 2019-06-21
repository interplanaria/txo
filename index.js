#!/usr/bin/env node
require('dotenv').config()
const bsv = require('bsv')
const RpcClient = require('bitcoind-rpc');
var fromHash = function(hash, verbose, config) {
  let c;
  if (config) {
    c = config;
  } else {
    c = {
      protocol: 'http',
      user: process.env.BITCOIN_USERNAME ? process.env.BITCOIN_USERNAME : 'root',
      pass: process.env.BITCOIN_PASSWORD ? process.env.BITCOIN_PASSWORD : 'bitcoin',
      host: process.env.BITCOIN_IP ? process.env.BITCOIN_IP : '127.0.0.1',
      port: process.env.BITCOIN_PORT ? process.env.BITCOIN_PORT : '8332',
    }
  }
  
  const rpc = new RpcClient(c)
  return new Promise(function(resolve, reject) {
    if (verbose) {
      rpc.getRawTransaction(hash, "1", async function(err, transaction) {
        if (err) {
          reject(err)
        } else {
          let result = await fromTx(transaction.result.hex, { confirmations: transaction.result.confirmations })
          result.tx.r = transaction.result.hex
          if (transaction.result.vin && transaction.result.vin.length === 1 && transaction.result.vin[0].coinbase) {
            result.coinbase = transaction.result.vin[0].coinbase
          }
          resolve(result)
        }
      })
    } else {
      rpc.getRawTransaction(hash, async function(err, transaction) {
        if (err) {
          reject(err);
        } else {
          let result = await fromTx(transaction.result)
          result.tx.r = transaction.result
          resolve(result)
        }
      })
    }
  })
}
var fromTx = function(transaction, options) {
  return new Promise(function(resolve, reject) {
    let gene = new bsv.Transaction(transaction);
    let t = gene.toObject()
    let result = [];
    let inputs = [];
    let outputs = [];
    let graph = {};
    if (gene.inputs) {
      gene.inputs.forEach(function(input, input_index) {
        if (input.script) {
          let xput = { i: input_index }
          input.script.chunks.forEach(function(c, chunk_index) {
            let chunk = c;
            if (c.buf) {
              if (c.buf.byteLength >= 512) {
                xput["lb" + chunk_index] = c.buf.toString('base64')
              } else {
                xput["b" + chunk_index] = c.buf.toString('base64')
              }
              if (options && options.h && options.h > 0) {
                xput["h" + chunk_index] = c.buf.toString('hex')
              }
            } else {
              if (typeof c.opcodenum !== 'undefined') {
                xput["b" + chunk_index] = {
                  op: c.opcodenum
                }
              } else {
                xput["b" + chunk_index] = c;
              }
            }
          })
          xput.str = input.script.toASM()
          let sender = {
            h: input.prevTxId.toString('hex'),
            i: input.outputIndex
          }
          let address = input.script.toAddress(bsv.Networks.livenet).toString()
          if (address && address.length > 0) {
            sender.a = address;
          }
          xput.e = sender;
          inputs.push(xput)
        }
      })
    }
    if (gene.outputs) {
      gene.outputs.forEach(function(output, output_index) {
        if (output.script) {
          let xput = { i: output_index }
          output.script.chunks.forEach(function(c, chunk_index) {
            let chunk = c;
            if (c.buf) {
              if (c.buf.byteLength >= 512) {
                xput["lb" + chunk_index] = c.buf.toString('base64')
                xput["ls" + chunk_index] = c.buf.toString('utf8')
              } else {
                xput["b" + chunk_index] = c.buf.toString('base64')
                xput["s" + chunk_index] = c.buf.toString('utf8')
              }
              if (options && options.h && options.h > 0) {
                xput["h" + chunk_index] = c.buf.toString('hex')
              }
            } else {
              if (typeof c.opcodenum !== 'undefined') {
                xput["b" + chunk_index] = {
                  op: c.opcodenum
                }
              } else {
                xput["b" + chunk_index] = c;
              }
            }
          })
          xput.str = output.script.toASM()
          let receiver = {
            v: output.satoshis,
            i: output_index
          }
          let address = output.script.toAddress(bsv.Networks.livenet).toString()
          if (address && address.length > 0) {
            receiver.a = address;
          }
          xput.e = receiver;
          outputs.push(xput)
        }
      })
    }
    let r = {
      tx: { h: t.hash },
      in: inputs,
      out: outputs
    }
    // confirmations
    if (options && options.confirmations) {
      r.confirmations = options.confirmations
    }
    resolve(r)
  })
}
if (require.main === module) {
  if (process.argv.length >= 3) {
    let hash = process.argv[2];
    fromHash(hash).then(function(result) {
      console.log(result)
    })
  }
}
module.exports = {
  fromHash: fromHash,
  fromTx: fromTx
}
