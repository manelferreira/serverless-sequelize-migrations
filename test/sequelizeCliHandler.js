const sinon = require("sinon");
const childProcess = require("child_process");
const SequelizeCliHandler = require("../handlers/sequelizeCliHandler");

describe("Sequelize CLI Handler", () => {
  it("create migration", () => {
    const serverless = {
      cli: {
        log: sinon.spy()
      }
    };

    const execSyncStub = sinon.stub(childProcess, "execSync").returns("result");

    const bufferStub = sinon.stub(Buffer, "from").returns("cmdOutput");

    const sequelizeCliHandler = new SequelizeCliHandler(serverless);

    const migrationName = "name";
    sequelizeCliHandler.createMigration(migrationName);

    sinon.assert.calledOnce(serverless.cli.log);
    sinon.assert.calledWith(Buffer.from, "result", "base64");
    sinon.assert.calledWith(
      childProcess.execSync,
      `node_modules/.bin/sequelize migration:create --name ${migrationName}`
    );

    execSyncStub.restore();
    bufferStub.restore();
  });
});
