module.exports = {
  run: [{
    method: "fs.rm",
    params: {
      path: "app/trellis2"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "app"
    }
  }, {
    method: "fs.rm",
    params: {
      path: "extensions"
    }
  }]
}
