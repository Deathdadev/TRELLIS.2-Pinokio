module.exports = {
  run: [
    // Pull launcher repo (patches, scripts)
    {
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    // Pull app repo
    {
      method: "shell.run",
      params: {
        message: "git pull",
        path: "app"
      }
    }
  ]
}
