var concatStream = require('concat-stream')
var util = require('util')
var Readable = require('stream').Readable

function AbstractParser (rdf) {
  var self = this

  this.rdf = rdf

  this.parse = function (data, callback, base, filter, graph) {
    graph = graph || self.rdf.createGraph()

    var pushTriple = function (triple) {
      graph.add(triple)
    }

    return new Promise(function (resolve, reject) {
      self.process(data, pushTriple, base, filter, function (error) {
        // callback API
        if (callback) {
          callback(error, graph)
        }

        // Promise API
        if (error) {
          reject(error)
        } else {
          resolve(graph)
        }
      })
    })
  }

  this.stream = function (inputStream, base, filter) {
    var outputStream = new AbstractParser.TripleReadStream()

    AbstractParser.streamToData(inputStream).then(function (data) {
      self.process(data, function (triple) {
        outputStream.push(triple)
      }, base, filter, function (error) {
        if (error) {
          outputStream.emit('error', error)
        } else {
          outputStream.emit('end')
        }
      })
    }).catch(function (error) {
      outputStream.emit('error', error)
    })

    return outputStream
  }
}

AbstractParser.streamToData = function (stream) {
  return new Promise(function (resolve, reject) {
    if (typeof stream !== 'object' || typeof stream.read !== 'function') {
      return resolve(stream)
    }

    stream.on('error', function (error) {
      reject(error)
    })

    stream.pipe(concatStream(function (data) {
      resolve(data)
    }))
  })
}

AbstractParser.TripleReadStream = function () {
  Readable.call(this, {objectMode: true})

  this._read = function () {
    return 0
  }
}

util.inherits(AbstractParser.TripleReadStream, Readable)

module.exports = AbstractParser
