const sinon = require("sinon");
const childProcess = require("child_process");
const SequelizeCliHandler = require("../handlers/sequelizeCliHandler");

describe("Sequelize CLI Handler", () => {
  describe("createMigration", () => {
    beforeEach(() => {
      const serverless = {
        cli: {
          log: sinon.spy()
        }
      };
      this.serverless = serverless;

      const execSyncStub = sinon
        .stub(childProcess, "execSync")
        .returns("result");
      this.execSyncStub = execSyncStub;

      const bufferStub = sinon.stub(Buffer, "from").returns("cmdOutput");
      this.bufferStub = bufferStub;
    });

    afterEach(() => {
      this.execSyncStub.restore();
      this.bufferStub.restore();
    });

    context("when specifying a migrations folder path", () => {
      it("create migration", () => {
        const customFolder = "./customFolder";

        const sequelizeCliHandler = new SequelizeCliHandler(
          this.serverless,
          customFolder
        );

        const migrationName = "name";
        sequelizeCliHandler.createMigration(migrationName);

        sinon.assert.calledOnce(this.serverless.cli.log);
        sinon.assert.calledWith(this.bufferStub, "result", "base64");
        sinon.assert.calledWith(
          this.execSyncStub,
          `node_modules/.bin/sequelize migration:create --name ${migrationName} --migrations-path ${customFolder}`
        );
      });
    });

    context("when using the default migrations folder", () => {
      it("create migration", () => {
        const sequelizeCliHandler = new SequelizeCliHandler(this.serverless);

        const migrationName = "name";
        sequelizeCliHandler.createMigration(migrationName);

        sinon.assert.calledOnce(this.serverless.cli.log);
        sinon.assert.calledWith(this.bufferStub, "result", "base64");
        sinon.assert.calledWith(
          this.execSyncStub,
          `node_modules/.bin/sequelize migration:create --name ${migrationName} --migrations-path ./migrations`
        );
      });
    });
  });
});
