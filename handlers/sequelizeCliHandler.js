const childProcess = require("child_process");

class SequelizeCliHandler {
  constructor(serverless, path = "./migrations") {
    this.serverless = serverless;
    this.path = path;
  }

  createMigration(name) {
    const cmdOut = childProcess.execSync(
      `node_modules/.bin/sequelize migration:create --name ${name} --migrations-path ${this.path}`
    );
    const output = Buffer.from(cmdOut, "base64").toString();
    this.serverless.cli.log(output);
  }
}

module.exports = SequelizeCliHandler;
