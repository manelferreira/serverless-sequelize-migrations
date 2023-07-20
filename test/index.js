const { expect } = require("chai");
const sinon = require("sinon");
const SlsSequelizeMigrations = require("../index");
const MigrationsHandler = require("../handlers/migrationsHandler");
const SequelizeCliHandler = require("../handlers/sequelizeCliHandler");
const DatabaseConnectionUrlBuilder = require("../lib/databaseConnectionUrlBuilder");

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
        "migrations:up:run",
        "migrations:down:run",
        "migrations:reset:run",
        "migrations:list:show",
        "migrations:create:run"
      ]);
    });
  });

  describe("Set up migrations handler", () => {
    beforeEach(() => {
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

    context("creates instance with success", () => {
      it("creates simple instance", () => {
        const setupDatabaseStub = sinon
          .stub(DatabaseConnectionUrlBuilder.prototype, "build")
          .returns("some database connection values");

        const migrationsHandlerInitializeStub = sinon.stub(
          MigrationsHandler.prototype,
          "initialize"
        );

        const plugin = new SlsSequelizeMigrations(this.serverless, {});

        const migrationsHandler = plugin.setUpMigrationsHandler();

        sinon.assert.calledOnce(
          DatabaseConnectionUrlBuilder.prototype.build
        );
        sinon.assert.calledOnce(MigrationsHandler.prototype.initialize);

        expect(migrationsHandler).to.be.instanceOf(MigrationsHandler);
        expect(migrationsHandler.path).to.be.eq("./migrations");
        expect(migrationsHandler.verbose).to.be.eq(false);

        setupDatabaseStub.restore();
        migrationsHandlerInitializeStub.restore();
      });

      it("creates instance with migrationsPath variable defined on service custom section", () => {
        this.serverless = {
          ...this.serverless,
          service: {
            custom: {
              migrationsPath: "./some/migrations/path"
            }
          }
        };

        const setupDatabaseStub = sinon
          .stub(DatabaseConnectionUrlBuilder.prototype, "build")
          .returns("some database connection value");

        const migrationsHandlerInitializeStub = sinon.stub(
          MigrationsHandler.prototype,
          "initialize"
        );

        const plugin = new SlsSequelizeMigrations(this.serverless, {});

        const migrationsHandler = plugin.setUpMigrationsHandler();

        sinon.assert.calledOnce(
          DatabaseConnectionUrlBuilder.prototype.build
        );
        sinon.assert.calledOnce(MigrationsHandler.prototype.initialize);

        expect(migrationsHandler).to.be.instanceOf(MigrationsHandler);
        expect(migrationsHandler.path).to.be.eq(
          this.serverless.service.custom.migrationsPath
        );
        expect(migrationsHandler.verbose).to.be.eq(false);

        setupDatabaseStub.restore();
        migrationsHandlerInitializeStub.restore();
      });

      it("creates instance overriding migrationsPath variable with '--path' CLI option", () => {
        this.serverless = {
          ...this.serverless,
          service: {
            custom: {
              migrationsPath: "./some/migrations/path"
            }
          }
        };

        const setupDatabaseStub = sinon
          .stub(DatabaseConnectionUrlBuilder.prototype, "build")
          .returns("some database connection value");

        const migrationsHandlerInitializeStub = sinon.stub(
          MigrationsHandler.prototype,
          "initialize"
        );

        const options = {
          path: "override/migrations/path/test"
        };

        const plugin = new SlsSequelizeMigrations(this.serverless, options);

        const migrationsHandler = plugin.setUpMigrationsHandler();

        sinon.assert.calledOnce(
          DatabaseConnectionUrlBuilder.prototype.build
        );
        sinon.assert.calledOnce(MigrationsHandler.prototype.initialize);

        expect(migrationsHandler).to.be.instanceOf(MigrationsHandler);
        expect(migrationsHandler.path).to.be.eq(options.path);
        expect(migrationsHandler.verbose).to.be.eq(false);

        setupDatabaseStub.restore();
        migrationsHandlerInitializeStub.restore();
      });
    });
  });

  describe("Set up sequelize CLI handler", () => {
    before(() => {
      this.serverless = {
        cli: {
          log: () => {}
        }
      };
    });

    it("creates instance with success", () => {
      const plugin = new SlsSequelizeMigrations(this.serverless, {});

      const sequelizeCLiHandler = plugin.setUpSequelizeCliHandler();

      expect(sequelizeCLiHandler).to.be.instanceOf(SequelizeCliHandler);
      expect(sequelizeCLiHandler.path).to.be.eq("./migrations");
    });

    it("creates instance with migrationsPath variable defined on service custom section", () => {
      const options = {
        path: "override/migrations/path/test"
      };

      const plugin = new SlsSequelizeMigrations(this.serverless, options);

      const sequelizeCLiHandler = plugin.setUpSequelizeCliHandler();

      expect(sequelizeCLiHandler).to.be.instanceOf(SequelizeCliHandler);
      expect(sequelizeCLiHandler.path).to.be.eq(options.path);
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

      context("when --times is defined", () => {
        it("revert migrations with success", async () => {
          const serverless = {
            service: {
              provider: {}
            },
            cli: {
              log: () => {}
            }
          };

          const options = {
            times: '2'
          };

          const plugin = new SlsSequelizeMigrations(serverless, options);

          const revertFunctionSpy = sinon.stub();
  
          plugin.setUpMigrationsHandler = () =>
            sinon.createStubInstance(MigrationsHandler, {
              revert: revertFunctionSpy
            });
  
          await plugin.revert();
  
          sinon.assert.notCalled(process.exit);
          sinon.assert.calledOnce(revertFunctionSpy);
          sinon.assert.calledWith(revertFunctionSpy, 2);
        });
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
