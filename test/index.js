const { expect } = require("chai");
const sinon = require("sinon");
const SlsSequelizeMigrations = require("../index");
const MigrationsHandler = require("../handlers/migrationsHandler");
const SequelizeCliHandler = require("../handlers/sequelizeCliHandler");

describe("Serverless sequelize migrations", () => {
  describe("When an instance is created", () => {
    before(() => {
      this.plugin = new SlsSequelizeMigrations({}, {});
    });

    it("should have migrations command", () => {
      const commands = Object.keys(this.plugin.commands);
      expect(commands).to.eql(["migrations"]);
    });

    it("should have migrations subcommands", () => {
      const subCommands = Object.keys(this.plugin.commands.migrations.commands);
      expect(subCommands).to.eql(["create", "up", "down", "reset", "list"]);
    });

    it("should have hooks", () => {
      const hooks = Object.keys(this.plugin.hooks);
      expect(hooks).to.eql([
        "migrations:showPluginInfo",
        "migrations:up:run",
        "migrations:down:run",
        "migrations:reset:run",
        "migrations:list:show",
        "migrations:create:run"
      ]);
    });
  });

  describe("Set up database values", () => {
    before(() => {
      this.serverless = {
        service: {
          provider: {
            environment: {}
          }
        },
        cli: {}
      };
    });

    beforeEach(() => {
      this.processStub = sinon.stub(process, "exit");
    });

    afterEach(() => {
      delete process.env.DB_DIALECT;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USERNAME;
      delete process.env.DB_PASSWORD;
      this.processStub.restore();
    });

    it("fail if DB_DIALECT is missing", () => {
      this.serverless.service.provider.environment = {
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_DIALECT in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("fail if DB_HOST is missing", () => {
      this.serverless.service.provider.environment = {
        DB_DIALECT: "mysql",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_HOST in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("fail if DB_PORT is missing", () => {
      this.serverless.service.provider.environment = {
        DB_DIALECT: "mysql",
        DB_HOST: "localhost",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_PORT in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("fail if DB_NAME is missing", () => {
      this.serverless.service.provider.environment = {
        DB_DIALECT: "mysql",
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_NAME in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("fail if DB_USERNAME is missing", () => {
      this.serverless.service.provider.environment = {
        DB_DIALECT: "mysql",
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_PASSWORD: "password"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_USERNAME in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("fail if DB_PASSWORD is missing", () => {
      this.serverless.service.provider.environment = {
        DB_DIALECT: "mysql",
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username"
      };
      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      plugin.setUpDatabaseValues();
      sinon.assert.calledWith(
        logFunction,
        "Missing DB_PASSWORD in the environment variables"
      );
      sinon.assert.calledWith(process.exit, 1);
    });

    it("returns database data", () => {
      const envDbData = {
        DB_DIALECT: "mysql",
        DB_HOST: "localhost",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
      this.serverless.service.provider.environment = envDbData;

      const logFunction = sinon.spy();
      this.serverless.cli.log = logFunction;

      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      const database = plugin.setUpDatabaseValues();

      expect(database).to.be.eql({
        DIALECT: envDbData.DB_DIALECT,
        HOST: envDbData.DB_HOST,
        PORT: envDbData.DB_PORT,
        NAME: envDbData.DB_NAME,
        USERNAME: envDbData.DB_USERNAME,
        PASSWORD: envDbData.DB_PASSWORD
      });
    });
  });

  describe("Set up migrations handler", () => {
    before(() => {
      this.serverless = {
        cli: {
          log: () => {}
        }
      };

      this.database = {
        DB_DIALECT: "mysql",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
    });

    it("creates instance with success", () => {
      const setupDatabaseStub = sinon
        .stub(SlsSequelizeMigrations.prototype, "setUpDatabaseValues")
        .returns({
          DIALECT: "mysql",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        });

      const migrationsHandlerInitializeStub = sinon.stub(
        MigrationsHandler.prototype,
        "initialize"
      );

      const plugin = new SlsSequelizeMigrations(this.serverless, this.database);

      const migrationsHandler = plugin.setUpMigrationsHandler();

      sinon.assert.calledOnce(
        SlsSequelizeMigrations.prototype.setUpDatabaseValues
      );
      sinon.assert.calledOnce(MigrationsHandler.prototype.initialize);

      expect(migrationsHandler).to.be.instanceOf(MigrationsHandler);

      setupDatabaseStub.restore();
      migrationsHandlerInitializeStub.restore();
    });
  });

  describe("Set up sequelize CLI handler", () => {
    before(() => {
      this.serverless = {
        cli: {
          log: () => {}
        }
      };

      this.database = {
        DB_DIALECT: "mysql",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
    });

    it("creates instance with success", () => {
      const plugin = new SlsSequelizeMigrations(this.serverless, this.database);

      const sequelizeCLiHandler = plugin.setUpSequelizeCliHandler();

      expect(sequelizeCLiHandler).to.be.instanceOf(SequelizeCliHandler);
    });
  });

  describe("Show plugin info", () => {
    before(() => {
      this.serverless = {
        cli: {
          generateCommandsHelp: sinon.spy()
        }
      };

      this.database = {
        DB_DIALECT: "mysql",
        DB_PORT: "3306",
        DB_NAME: "name",
        DB_USERNAME: "username",
        DB_PASSWORD: "password"
      };
    });

    it("show plugin info with success", () => {
      const plugin = new SlsSequelizeMigrations(this.serverless, this.database);

      plugin.showPluginInfo();

      sinon.assert.calledWith(this.serverless.cli.generateCommandsHelp, [
        "migrations"
      ]);
    });
  });

  describe("Migrations methods", () => {
    describe("migrate", () => {
      beforeEach(() => {
        this.processStub = sinon.stub(process, "exit");
      });

      afterEach(() => {
        this.processStub.restore();
      });

      it("applies migrations with success", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            migrate: true
          });

        await plugin.migrate();

        sinon.assert.notCalled(process.exit);
      });

      it("fails applying migrations", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            migrate: false
          });

        await plugin.migrate();

        sinon.assert.calledWith(process.exit, 1);
      });

      it("fails if error is thrown", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {}
        };
        const logFunction = sinon.spy();
        serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(serverless, {});

        const error = new Error("something went wrong");

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            migrate: sinon.stub().throws(error)
          });

        await plugin.migrate();

        sinon.assert.calledWith(
          logFunction,
          `Error trying to apply migrations: \n${error}`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });

    describe("revert", () => {
      beforeEach(() => {
        this.processStub = sinon.stub(process, "exit");
      });

      afterEach(() => {
        this.processStub.restore();
      });

      it("revert migrations with success", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            revert: null
          });

        await plugin.revert();

        sinon.assert.notCalled(process.exit);
      });

      it("fails if error is thrown", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {}
        };
        const logFunction = sinon.spy();
        serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(serverless, {});

        const error = new Error("something went wrong");

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            revert: sinon.stub().throws(error)
          });

        await plugin.revert();

        sinon.assert.calledWith(
          logFunction,
          `Error trying to rollback migrations: \n${error}`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });

    describe("reset", () => {
      beforeEach(() => {
        this.processStub = sinon.stub(process, "exit");
      });

      afterEach(() => {
        this.processStub.restore();
      });

      it("reset migrations with success", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            reset: null
          });

        await plugin.reset();

        sinon.assert.notCalled(process.exit);
      });

      it("fails if error is thrown", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {}
        };
        const logFunction = sinon.spy();
        serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(serverless, {});

        const error = new Error("something went wrong");

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            reset: sinon.stub().throws(error)
          });

        await plugin.reset();

        sinon.assert.calledWith(
          logFunction,
          `Error trying to revert all migrations: \n${error}`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });

    describe("list", () => {
      beforeEach(() => {
        this.processStub = sinon.stub(process, "exit");
      });

      afterEach(() => {
        this.processStub.restore();
      });

      it("list migrations with success", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            list: null
          });

        await plugin.list();

        sinon.assert.notCalled(process.exit);
      });

      it("fails if error is thrown", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {}
        };
        const logFunction = sinon.spy();
        serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(serverless, {});

        const error = new Error("something went wrong");

        plugin.setUpMigrationsHandler = () =>
          sinon.createStubInstance(MigrationsHandler, {
            list: sinon.stub().throws(error)
          });

        await plugin.list();

        sinon.assert.calledWith(
          logFunction,
          `Error trying to list migrations: \n${error}`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });

    describe("createMigration", () => {
      beforeEach(() => {
        this.processStub = sinon.stub(process, "exit");
      });

      afterEach(() => {
        this.processStub.restore();
      });

      it("create migration with success", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {
            log: () => {}
          }
        };
        const plugin = new SlsSequelizeMigrations(serverless, {});

        plugin.setUpSequelizeCliHandler = () =>
          sinon.createStubInstance(SequelizeCliHandler, {
            createMigration: null
          });

        await plugin.createMigration();

        sinon.assert.notCalled(process.exit);
      });

      it("fails if error is thrown", async () => {
        const serverless = {
          service: {
            provider: {}
          },
          cli: {}
        };
        const logFunction = sinon.spy();
        serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(serverless, {});

        const error = new Error("something went wrong");

        plugin.setUpSequelizeCliHandler = () =>
          sinon.createStubInstance(SequelizeCliHandler, {
            createMigration: sinon.stub().throws(error)
          });

        await plugin.createMigration();

        sinon.assert.calledWith(
          logFunction,
          `Error trying to create migration: \n${error}`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });
  });
});
