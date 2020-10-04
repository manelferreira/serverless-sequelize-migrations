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
      delete process.env.DB_DIALECT;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USERNAME;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_CONNECTION_URL;

      delete this.serverless.service.provider.environment.DB_DIALECT;
      delete this.serverless.service.provider.environment.DB_HOST;
      delete this.serverless.service.provider.environment.DB_PORT;
      delete this.serverless.service.provider.environment.DB_NAME;
      delete this.serverless.service.provider.environment.DB_USERNAME;
      delete this.serverless.service.provider.environment.DB_PASSWORD;
      delete this.serverless.service.provider.environment.DB_CONNECTION_URL;

      this.processStub = sinon.stub(process, "exit");
    });

    afterEach(() => {
      delete process.env.DB_DIALECT;
      delete process.env.DB_HOST;
      delete process.env.DB_PORT;
      delete process.env.DB_NAME;
      delete process.env.DB_USERNAME;
      delete process.env.DB_PASSWORD;
      delete process.env.DB_CONNECTION_URL;

      delete this.serverless.service.provider.environment.DB_DIALECT;
      delete this.serverless.service.provider.environment.DB_HOST;
      delete this.serverless.service.provider.environment.DB_PORT;
      delete this.serverless.service.provider.environment.DB_NAME;
      delete this.serverless.service.provider.environment.DB_USERNAME;
      delete this.serverless.service.provider.environment.DB_PASSWORD;
      delete this.serverless.service.provider.environment.DB_CONNECTION_URL;

      this.processStub.restore();
    });

    context("when some required property is missing", () => {
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

        plugin.setUpDatabaseConnectionValues();
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

        plugin.setUpDatabaseConnectionValues();
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

        plugin.setUpDatabaseConnectionValues();
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

        plugin.setUpDatabaseConnectionValues();
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

        plugin.setUpDatabaseConnectionValues();
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

        plugin.setUpDatabaseConnectionValues();
        sinon.assert.calledWith(
          logFunction,
          "Missing DB_PASSWORD in the environment variables"
        );
        sinon.assert.calledWith(process.exit, 1);
      });

      it("fail if DB_CONNECTION_URL is invalid", () => {
        const DB_CONNECTION_URL = "invalid_dialect://username:password@localhost:3306/name";
        this.serverless.service.provider.environment = {
          DB_CONNECTION_URL: DB_CONNECTION_URL
        };
        const logFunction = sinon.spy();
        this.serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(this.serverless, {});

        plugin.setUpDatabaseConnectionValues();
        sinon.assert.calledWith(
          logFunction,
          `Database connection settings are invalid or results in malformed connection URL: ${
            DB_CONNECTION_URL
          }`
        );
        sinon.assert.calledWith(process.exit, 1);
      });
    });

    context("When all required properties are set through environment variables", () => {
      context("When DB_PASSWORD is falsy", () => {
        context("When value is set as null", () => {
          it("returns database data", () => {
            const envDbData = {
              DB_DIALECT: "mysql",
              DB_HOST: "localhost",
              DB_PORT: "3306",
              DB_NAME: "name",
              DB_USERNAME: "username",
              DB_PASSWORD: null
            };
            this.serverless.service.provider.environment = envDbData;

            const logFunction = sinon.spy();
            this.serverless.cli.log = logFunction;

            const plugin = new SlsSequelizeMigrations(this.serverless, {});

            const database = plugin.setUpDatabaseConnectionValues();

            expect(database).to.be.eql({
              CONNECTION_URL: `${envDbData.DB_DIALECT}://${envDbData.DB_USERNAME}:${envDbData.DB_PASSWORD}@${envDbData.DB_HOST}:${envDbData.DB_PORT}/${envDbData.DB_NAME}`
            });
          });
        });

        context("When value is set as an empty string", () => {
          it("returns database data", () => {
            const envDbData = {
              DB_DIALECT: "mysql",
              DB_HOST: "localhost",
              DB_PORT: "3306",
              DB_NAME: "name",
              DB_USERNAME: "username",
              DB_PASSWORD: ""
            };
            this.serverless.service.provider.environment = envDbData;

            const logFunction = sinon.spy();
            this.serverless.cli.log = logFunction;

            const plugin = new SlsSequelizeMigrations(this.serverless, {});

            const database = plugin.setUpDatabaseConnectionValues();

            expect(database).to.be.eql({
              CONNECTION_URL: `${envDbData.DB_DIALECT}://${envDbData.DB_USERNAME}:${envDbData.DB_PASSWORD}@${envDbData.DB_HOST}:${envDbData.DB_PORT}/${envDbData.DB_NAME}`
            });
          });
        });
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

        const database = plugin.setUpDatabaseConnectionValues();

        expect(database).to.be.eql({
          CONNECTION_URL: `${envDbData.DB_DIALECT}://${envDbData.DB_USERNAME}:${envDbData.DB_PASSWORD}@${envDbData.DB_HOST}:${envDbData.DB_PORT}/${envDbData.DB_NAME}`
        });
      });
    });

    context("When all required properties are set through CLI options", () => {
      context("When DB_PASSWORD is falsy", () => {
        context("When value is set as null", () => {
          it("returns database data", () => {
            const cliOptionsDbData = {
              dbDialect: "cliSetDialect",
              dbHost: "cliSetHost",
              dbPort: "cliSetPort",
              dbName: "cliSetName",
              dbUsername: "cliSetUsername",
              dbPassword: null
            };

            const logFunction = sinon.spy();
            this.serverless.cli.log = logFunction;

            const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);

            const database = plugin.setUpDatabaseConnectionValues();

            expect(database).to.be.eql({
              CONNECTION_URL: `${cliOptionsDbData.dbDialect}://${cliOptionsDbData.dbUsername}:@${cliOptionsDbData.dbHost}:${cliOptionsDbData.dbPort}/${cliOptionsDbData.dbName}`
            });
          });
        });

        context("When value is set as an empty string", () => {
          it("returns database data", () => {
            const cliOptionsDbData = {
              dbDialect: "cliSetDialect",
              dbHost: "cliSetHost",
              dbPort: "cliSetPort",
              dbName: "cliSetName",
              dbUsername: "cliSetUsername",
              dbPassword: ""
            };

            const logFunction = sinon.spy();
            this.serverless.cli.log = logFunction;

            const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);

            const database = plugin.setUpDatabaseConnectionValues();

            expect(database).to.be.eql({
              CONNECTION_URL: `${cliOptionsDbData.dbDialect}://${cliOptionsDbData.dbUsername}:${cliOptionsDbData.dbPassword}@${cliOptionsDbData.dbHost}:${cliOptionsDbData.dbPort}/${cliOptionsDbData.dbName}`
            });
          });
        });
      });

      it("returns database data", () => {
        const cliOptionsDbData = {
          dbDialect: "cliSetDialect",
          dbHost: "cliSetHost",
          dbPort: "cliSetPort",
          dbName: "cliSetName",
          dbUsername: "cliSetUsername",
          dbPassword: "cliSetPassword"
        };

        const logFunction = sinon.spy();
        this.serverless.cli.log = logFunction;

        const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);

        const database = plugin.setUpDatabaseConnectionValues();

        expect(database).to.be.eql({
          CONNECTION_URL: `${cliOptionsDbData.dbDialect}://${cliOptionsDbData.dbUsername}:${cliOptionsDbData.dbPassword}@${cliOptionsDbData.dbHost}:${cliOptionsDbData.dbPort}/${cliOptionsDbData.dbName}`
        });
      });
    });

    context("When some required properties are set through environment variables and others through CLI options", () => {
      beforeEach(() => {
        this.envDbData = {
          DB_DIALECT: "mysql",
          DB_HOST: "localhost",
          DB_PORT: "3306",
          DB_NAME: "name",
          DB_USERNAME: "username",
          DB_PASSWORD: "password"
        };

        this.serverless.service.provider.environment = this.envDbData;

        const logFunction = sinon.spy();
        this.serverless.cli.log = logFunction;
      });

      context ("When only dialect value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbDialect: "cliSetDialect"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${cliOptionsDbData.dbDialect}://${this.envDbData.DB_USERNAME}:${this.envDbData.DB_PASSWORD}@${this.envDbData.DB_HOST}:${this.envDbData.DB_PORT}/${this.envDbData.DB_NAME}`
          });
        });
      });

      context ("When only host value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbHost: "dbHost"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${this.envDbData.DB_USERNAME}:${this.envDbData.DB_PASSWORD}@${cliOptionsDbData.dbHost}:${this.envDbData.DB_PORT}/${this.envDbData.DB_NAME}`
          });
        });
      });

      context ("When only port value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbPort: "cliSetPort"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${this.envDbData.DB_USERNAME}:${this.envDbData.DB_PASSWORD}@${this.envDbData.DB_HOST}:${cliOptionsDbData.dbPort}/${this.envDbData.DB_NAME}`
          });
        });
      });

      context ("When only name value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbName: "cliSetName"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${this.envDbData.DB_USERNAME}:${this.envDbData.DB_PASSWORD}@${this.envDbData.DB_HOST}:${this.envDbData.DB_PORT}/${cliOptionsDbData.dbName}`
          });
        });
      });

      context ("When only username value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbUsername: "cliSetUsername"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${cliOptionsDbData.dbUsername}:${this.envDbData.DB_PASSWORD}@${this.envDbData.DB_HOST}:${this.envDbData.DB_PORT}/${this.envDbData.DB_NAME}`
          });
        });
      });

      context ("When only password value is set through CLI", () => {
        it("returns database data", () => {
          const cliOptionsDbData = {
            dbPassword: "cliSetPassword"
          };

          const plugin = new SlsSequelizeMigrations(this.serverless, cliOptionsDbData);
  
          const database = plugin.setUpDatabaseConnectionValues();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${this.envDbData.DB_USERNAME}:${cliOptionsDbData.dbPassword}@${this.envDbData.DB_HOST}:${this.envDbData.DB_PORT}/${this.envDbData.DB_NAME}`
          });
        });
      });
    })
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
          .stub(SlsSequelizeMigrations.prototype, "setUpDatabaseConnectionValues")
          .returns("some database connection values");

        const migrationsHandlerInitializeStub = sinon.stub(
          MigrationsHandler.prototype,
          "initialize"
        );

        const plugin = new SlsSequelizeMigrations(this.serverless, {});

        const migrationsHandler = plugin.setUpMigrationsHandler();

        sinon.assert.calledOnce(
          SlsSequelizeMigrations.prototype.setUpDatabaseConnectionValues
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
          .stub(SlsSequelizeMigrations.prototype, "setUpDatabaseConnectionValues")
          .returns("some database connection value");

        const migrationsHandlerInitializeStub = sinon.stub(
          MigrationsHandler.prototype,
          "initialize"
        );

        const plugin = new SlsSequelizeMigrations(this.serverless, {});

        const migrationsHandler = plugin.setUpMigrationsHandler();

        sinon.assert.calledOnce(
          SlsSequelizeMigrations.prototype.setUpDatabaseConnectionValues
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
          .stub(SlsSequelizeMigrations.prototype, "setUpDatabaseConnectionValues")
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
          SlsSequelizeMigrations.prototype.setUpDatabaseConnectionValues
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
      const plugin = new SlsSequelizeMigrations(this.serverless, {});

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
