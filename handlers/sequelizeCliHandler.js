const childProcess = require("child_process");

class SequelizeCliHandler {
  constructor(serverless) {
    this.serverless = serverless;
  }

  createMigration(name) {
    const cmdOut = childProcess.execSync(
      `sequelize migration:create --name ${name}`
    );
    const output = Buffer.from(cmdOut, "base64").toString();
    this.serverless.cli.log(output);
  }
}

module.exports = SequelizeCliHandler;
