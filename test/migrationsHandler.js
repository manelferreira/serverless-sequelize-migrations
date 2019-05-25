const { expect } = require("chai");
const sinon = require("sinon");
const Sequelize = require("sequelize");
const Umzug = require("umzug");
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const MigrationsHandler = require("../handlers/migrationsHandler");

chai.use(chaiAsPromised);

describe("Migrations Handler", () => {
  describe("initial setup", () => {
    describe("initialize", () => {
      before(() => {
        this.serverless = {
          cli: {
            log: () => {}
          }
        };
        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      it("calls initSequelize and initUmzug with success", () => {
        const initSequelizeStub = sinon
          .stub(MigrationsHandler.prototype, "initSequelize")
          .callsFake(() => "sequelize instance");
        const initUmzugStub = sinon
          .stub(MigrationsHandler.prototype, "initUmzug")
          .callsFake(() => "umzug instance");

        new MigrationsHandler(this.serverless, this.database).initialize();

        sinon.assert.calledOnce(MigrationsHandler.prototype.initSequelize);
        sinon.assert.calledOnce(MigrationsHandler.prototype.initUmzug);

        initSequelizeStub.restore();
        initUmzugStub.restore();
      });

      it("fails on initializing sequelize", () => {
        const error = new Error("somthing wrong");
        const initSequelizeStub = sinon
          .stub(MigrationsHandler.prototype, "initSequelize")
          .throws(error);
        const initUmzugStub = sinon
          .stub(MigrationsHandler.prototype, "initUmzug")
          .callsFake(() => "umzug instance");

        expect(() =>
          new MigrationsHandler(this.serverless, this.database).initialize()
        ).to.throw(error);

        sinon.assert.threw(MigrationsHandler.prototype.initSequelize, error);
        sinon.assert.notCalled(MigrationsHandler.prototype.initUmzug);

        initSequelizeStub.restore();
        initUmzugStub.restore();
      });

      it("fails on initializing umzug", () => {
        const error = new Error("somthing wrong");
        const initSequelizeStub = sinon
          .stub(MigrationsHandler.prototype, "initSequelize")
          .callsFake(() => "sequelize instance");
        const initUmzugStub = sinon
          .stub(MigrationsHandler.prototype, "initUmzug")
          .throws(error);

        expect(() =>
          new MigrationsHandler(this.serverless, this.database).initialize()
        ).to.throw(error);

        sinon.assert.calledOnce(MigrationsHandler.prototype.initSequelize);
        sinon.assert.threw(MigrationsHandler.prototype.initUmzug, error);

        initSequelizeStub.restore();
        initUmzugStub.restore();
      });
    });

    describe("initSequelize", () => {
      before(() => {
        this.serverless = {
          cli: {
            log: () => {}
          }
        };
      });

      it("creates sequelize instance with success", () => {
        const database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };

        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          database
        );

        const sequelize = migrationsHandler.initSequelize();

        expect(sequelize.options.dialect).to.eq(database.DIALECT);
        expect(sequelize.options.define.freezeTableName).to.eq(true);
        expect(sequelize.config.database).to.eq(database.NAME);
        expect(sequelize.config.username).to.eq(database.USERNAME);
        expect(sequelize.config.password).to.eq(database.PASSWORD);
        expect(sequelize.config.host).to.eq(database.HOST);
        expect(sequelize.config.port).to.eq(database.PORT);
      });

      it("fails if DB_DIALECT is missing", () => {
        const database = {
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };

        expect(() =>
          new MigrationsHandler(this.serverless, database).initSequelize()
        ).to.throw();
      });
    });

    describe("initUmzug", () => {
      before(() => {
        this.serverless = {
          cli: {
            log: () => {}
          }
        };

        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      it("creates umzug instance with success", () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.sequelize = migrationsHandler.initSequelize();

        const umzug = migrationsHandler.initUmzug();

        expect(umzug.options.storage).to.eq("sequelize");
        expect(umzug.options.storageOptions.sequelize).to.eq(
          migrationsHandler.sequelize
        );
        expect(umzug.options.upName).to.eq("up");
        expect(umzug.options.downName).to.eq("down");
        expect(umzug.options.migrations.path).to.eq("./migrations");
      });

      it("creates umzug instance specifying migrations path", () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database,
          "./migrationModels"
        );
        migrationsHandler.sequelize = migrationsHandler.initSequelize();

        const umzug = migrationsHandler.initUmzug();

        expect(umzug.options.storage).to.eq("sequelize");
        expect(umzug.options.storageOptions.sequelize).to.eq(
          migrationsHandler.sequelize
        );
        expect(umzug.options.upName).to.eq("up");
        expect(umzug.options.downName).to.eq("down");
        expect(umzug.options.migrations.path).to.eq("./migrationModels");
      });

      it("fails if sequelize is not initialized", () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.sequelize = null;

        expect(() =>
          new MigrationsHandler(this.serverless, this.database).initUmzug()
        ).to.throw();
      });
    });

    describe("migrate", () => {
      before(() => {
        this.serverless = {
          cli: {}
        };

        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      beforeEach(() => {
        this.sequelizeCloseStub = sinon.stub(Sequelize.prototype, "close");
        this.serverless.cli.log = sinon.spy();
      });

      afterEach(() => {
        this.sequelizeCloseStub.restore();
        this.serverless.cli.log.resetHistory();
      });

      it("returns ok if there is no pending migrations", async () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.initialize();

        const pendingStub = sinon.stub(Umzug.prototype, "pending").resolves([]);

        const success = await migrationsHandler.migrate();

        expect(success).to.eq(true);
        sinon.assert.calledWith(
          this.serverless.cli.log,
          "Looking for pending migrations..."
        );
        sinon.assert.calledWith(
          this.serverless.cli.log,
          "No pending migrations to apply"
        );
        sinon.assert.calledOnce(migrationsHandler.umzug.pending);
        sinon.assert.calledOnce(migrationsHandler.sequelize.close);

        pendingStub.restore();
      });

      it("migrate with success", async () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.initialize();

        const migrations = [
          {
            file: "migration1.js"
          },
          {
            file: "migration2.js"
          }
        ];

        const pendingStub = sinon
          .stub(Umzug.prototype, "pending")
          .resolves(migrations);
        const upStub = sinon.stub(Umzug.prototype, "up").resolves(migrations);
        const consLogStub = sinon.stub(console, "log");

        const success = await migrationsHandler.migrate();

        expect(success).to.eq(true);
        sinon.assert.calledWith(
          this.serverless.cli.log,
          "Looking for pending migrations..."
        );
        sinon.assert.calledWith(
          this.serverless.cli.log,
          "Applying pending migrations..."
        );
        sinon.assert.calledWith(
          this.serverless.cli.log,
          "2 applied migrations"
        );
        sinon.assert.calledWith(consLogStub, `=> ${migrations[0].file}`);
        sinon.assert.calledWith(consLogStub, `=> ${migrations[1].file}`);
        sinon.assert.calledOnce(migrationsHandler.umzug.pending);
        sinon.assert.calledOnce(migrationsHandler.umzug.up);
        sinon.assert.calledOnce(migrationsHandler.sequelize.close);

        pendingStub.restore();
        upStub.restore();
        consLogStub.restore();
      });

      context("cannot apply migrations", () => {
        it("fails on first migration file", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            }
          ];

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves(migrations);
          const upStub = sinon.stub(Umzug.prototype, "up").rejects(migrations);
          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves([]);

          const success = await migrationsHandler.migrate();

          expect(success).to.eq(false);
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Applying pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Error while applying migrations"
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for migration that has problems..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Something wrong with ${migrations[0].file}`
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.umzug.up);
          sinon.assert.calledOnce(migrationsHandler.umzug.executed);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          pendingStub.restore();
          upStub.restore();
          executedStub.restore();
        });

        it("fails on second migration file", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            }
          ];

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves(migrations);
          const upStub = sinon.stub(Umzug.prototype, "up").rejects(migrations);
          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves([
              {
                file: "migration1.js"
              }
            ]);

          const success = await migrationsHandler.migrate();

          expect(success).to.eq(false);
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Applying pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Error while applying migrations"
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for migration that has problems..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Something wrong with ${migrations[1].file}`
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.umzug.up);
          sinon.assert.calledOnce(migrationsHandler.umzug.executed);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          pendingStub.restore();
          upStub.restore();
          executedStub.restore();
        });

        it("fails on first migration file and revert", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            }
          ];

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves(migrations);
          const upStub = sinon.stub(Umzug.prototype, "up").rejects(migrations);
          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves([]);
          const downStub = sinon.stub(Umzug.prototype, "down");

          const success = await migrationsHandler.migrate(true);

          expect(success).to.eq(false);
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Applying pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Error while applying migrations"
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for migration that has problems..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Something wrong with ${migrations[0].file}`
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.umzug.up);
          sinon.assert.calledOnce(migrationsHandler.umzug.executed);
          sinon.assert.notCalled(migrationsHandler.umzug.down);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          pendingStub.restore();
          upStub.restore();
          executedStub.restore();
          downStub.restore();
        });

        it("fails on second migration file and revert", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            }
          ];

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves(migrations);
          const upStub = sinon.stub(Umzug.prototype, "up").rejects(migrations);
          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves([
              {
                file: "migration1.js"
              }
            ]);
          const downStub = sinon.stub(Umzug.prototype, "down").resolves([
            {
              file: "migration1.js"
            }
          ]);
          const consLogStub = sinon.stub(console, "log");

          const success = await migrationsHandler.migrate(true);

          expect(success).to.eq(false);
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Applying pending migrations..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Error while applying migrations"
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Looking for migration that has problems..."
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Something wrong with ${migrations[1].file}`
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Reverting applied migrations..."
          );
          sinon.assert.calledWith(
            consLogStub,
            `=> reverted ${migrations[0].file}`
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.umzug.up);
          sinon.assert.calledOnce(migrationsHandler.umzug.executed);
          sinon.assert.calledWith(migrationsHandler.umzug.down, {
            migrations: ["migration1.js"]
          });
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          pendingStub.restore();
          upStub.restore();
          executedStub.restore();
          downStub.restore();
          consLogStub.restore();
        });
      });
    });

    describe("revert", () => {
      before(() => {
        this.serverless = {
          cli: {}
        };

        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      beforeEach(() => {
        this.sequelizeCloseStub = sinon.stub(Sequelize.prototype, "close");
        this.serverless.cli.log = sinon.spy();
      });

      afterEach(() => {
        this.sequelizeCloseStub.restore();
        this.serverless.cli.log.resetHistory();
      });

      context("when --times and --name are not defined", () => {
        it("runs ok if there is no executed migrations", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const downStub = sinon.stub(Umzug.prototype, "down").resolves([]);

          await migrationsHandler.revert();

          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Trying to revert the last migration"
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.down);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
        });

        it("revert last migration with success", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            }
          ];

          const downStub = sinon
            .stub(Umzug.prototype, "down")
            .resolves(migrations);
          const consLogStub = sinon.stub(console, "log");

          await migrationsHandler.revert();

          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Trying to revert the last migration"
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.down);
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "1 reverted migrations"
          );
          sinon.assert.calledWith(consLogStub, "=> migration1.js");
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
          consLogStub.restore();
        });
      });

      context("when --times > 1 and --name is not defined", () => {
        it("runs ok if there is no executed migrations", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves([]);
          const downStub = sinon.stub(Umzug.prototype, "down").resolves([]);

          const times = 2;
          await migrationsHandler.revert(times);

          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Trying to revert the last ${times} migrations`
          );
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `There isn't migrations to revert`
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.executed);
          sinon.assert.notCalled(migrationsHandler.umzug.down);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
          executedStub.restore();
        });

        it("revert the two last migration with success", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            },
            {
              file: "migration3.js"
            }
          ];

          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves(migrations);
          const downStub = sinon
            .stub(Umzug.prototype, "down")
            .resolves([migrations[1], migrations[2]]);
          const consLogStub = sinon.stub(console, "log");

          const times = 2;
          await migrationsHandler.revert(times);

          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Trying to revert the last ${times} migrations`
          );
          sinon.assert.calledWith(migrationsHandler.umzug.down, {
            migrations: [migrations[2].file, migrations[1].file]
          });
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `${times} reverted migrations`
          );
          sinon.assert.calledWith(consLogStub, "=> migration3.js");
          sinon.assert.calledWith(consLogStub, "=> migration2.js");
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
          consLogStub.restore();
          executedStub.restore();
        });

        it("revert all migrations passing a high --times value", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            },
            {
              file: "migration3.js"
            }
          ];

          const executedStub = sinon
            .stub(Umzug.prototype, "executed")
            .resolves(migrations);
          const downStub = sinon
            .stub(Umzug.prototype, "down")
            .resolves(migrations);
          const consLogStub = sinon.stub(console, "log");

          const times = 100;
          await migrationsHandler.revert(times);

          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Trying to revert the last ${times} migrations`
          );
          sinon.assert.calledWith(migrationsHandler.umzug.down, {
            migrations: [
              migrations[2].file,
              migrations[1].file,
              migrations[0].file
            ]
          });
          sinon.assert.calledWith(
            this.serverless.cli.log,
            `${migrations.length} reverted migrations`
          );
          sinon.assert.calledWith(consLogStub, "=> migration3.js");
          sinon.assert.calledWith(consLogStub, "=> migration2.js");
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
          consLogStub.restore();
          executedStub.restore();
        });
      });

      context("when --times < 1 and name is not defined", () => {
        it("throws an error", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          await expect(migrationsHandler.revert(0)).to.be.rejectedWith(
            "--times must be greater than 0"
          );
        });
      });

      context("when name is defined", () => {
        it("runs ok if there is no executed migrations with name", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const downStub = sinon.stub(Umzug.prototype, "down").resolves([]);

          await migrationsHandler.revert();

          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Trying to revert the last migration"
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.down);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
        });

        it("revert named migration with success", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migration1.js"
            },
            {
              file: "migration2.js"
            },
            {
              file: "migration3.js"
            }
          ];

          const downStub = sinon
            .stub(Umzug.prototype, "down")
            .resolves([migrations[1]]);
          const consLogStub = sinon.stub(console, "log");

          const name = "migration2.js";
          await migrationsHandler.revert(1, name);

          sinon.assert.calledWith(
            this.serverless.cli.log,
            `Trying to revert migration ${name}`
          );
          sinon.assert.calledWith(migrationsHandler.umzug.down, {
            migrations: [name]
          });
          sinon.assert.calledWith(
            this.serverless.cli.log,
            "1 reverted migrations"
          );
          sinon.assert.calledWith(consLogStub, `=> ${name}`);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          downStub.restore();
          consLogStub.restore();
        });
      });
    });

    describe("reset", () => {
      before(() => {
        this.serverless = {
          cli: {}
        };

        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      beforeEach(() => {
        this.sequelizeCloseStub = sinon.stub(Sequelize.prototype, "close");
        this.serverless.cli.log = sinon.spy();
      });

      afterEach(() => {
        this.sequelizeCloseStub.restore();
        this.serverless.cli.log.resetHistory();
      });

      it("runs ok if there is no executed migrations", async () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.initialize();

        const downStub = sinon.stub(Umzug.prototype, "down").resolves([]);

        await migrationsHandler.reset();

        sinon.assert.calledWith(
          this.serverless.cli.log,
          "Trying to revert all migrations..."
        );
        sinon.assert.calledWith(migrationsHandler.umzug.down, {
          to: 0
        });
        sinon.assert.calledOnce(migrationsHandler.sequelize.close);

        downStub.restore();
      });

      it("revert all migrations with success", async () => {
        const migrationsHandler = new MigrationsHandler(
          this.serverless,
          this.database
        );
        migrationsHandler.initialize();

        const migrations = [
          {
            file: "migration1.js"
          },
          {
            file: "migration2.js"
          },
          {
            file: "migration3.js"
          }
        ];

        const downStub = sinon
          .stub(Umzug.prototype, "down")
          .resolves(migrations);
        const consLogStub = sinon.stub(console, "log");

        await migrationsHandler.reset();

        sinon.assert.calledWith(
          this.serverless.cli.log,
          "Trying to revert all migrations..."
        );
        sinon.assert.calledWith(migrationsHandler.umzug.down, {
          to: 0
        });
        sinon.assert.calledWith(
          this.serverless.cli.log,
          `${migrations.length} reverted migrations`
        );
        sinon.assert.calledWith(consLogStub, "=> migration3.js");
        sinon.assert.calledWith(consLogStub, "=> migration2.js");
        sinon.assert.calledWith(consLogStub, "=> migration1.js");
        sinon.assert.calledOnce(migrationsHandler.sequelize.close);

        downStub.restore();
        consLogStub.restore();
      });
    });

    describe("list", () => {
      before(() => {
        this.serverless = {
          cli: {}
        };

        this.database = {
          DIALECT: "mysql",
          HOST: "localhost",
          PORT: "3306",
          NAME: "name",
          USERNAME: "username",
          PASSWORD: "password"
        };
      });

      beforeEach(() => {
        this.sequelizeCloseStub = sinon.stub(Sequelize.prototype, "close");
        this.serverless.cli.log = sinon.spy();
      });

      afterEach(() => {
        this.sequelizeCloseStub.restore();
        this.serverless.cli.log.resetHistory();
      });

      context("when there are no explicitly passed parameters", () => {
        it("returns ok if there are no pending migrations", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves([]);

          await migrationsHandler.list();

          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Searching for pending migrations..."
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);

          pendingStub.restore();
        });

        it("returns pending migrations", async () => {
          const migrationsHandler = new MigrationsHandler(
            this.serverless,
            this.database
          );
          migrationsHandler.initialize();

          const migrations = [
            {
              file: "migrations1.js"
            },
            {
              file: "migrations2.js"
            },
            {
              file: "migrations3.js"
            }
          ];

          const pendingStub = sinon
            .stub(Umzug.prototype, "pending")
            .resolves(migrations);
          const consLogStub = sinon.stub(console, "log");

          await migrationsHandler.list();

          sinon.assert.calledWith(
            this.serverless.cli.log,
            "Searching for pending migrations..."
          );
          sinon.assert.calledOnce(migrationsHandler.umzug.pending);
          sinon.assert.calledOnce(migrationsHandler.sequelize.close);
          sinon.assert.calledWith(consLogStub, `=> ${migrations[0].file}`);
          sinon.assert.calledWith(consLogStub, `=> ${migrations[1].file}`);
          sinon.assert.calledWith(consLogStub, `=> ${migrations[2].file}`);

          pendingStub.restore();
          consLogStub.restore();
        });
      });

      context("when there are explicitly passed parameters", () => {
        context(`when calling with 'pending' status`, () => {
          it("returns ok if there are no pending migrations", async () => {
            const migrationsHandler = new MigrationsHandler(
              this.serverless,
              this.database
            );
            migrationsHandler.initialize();

            const pendingStub = sinon
              .stub(Umzug.prototype, "pending")
              .resolves([]);

            const status = "pending";
            await migrationsHandler.list(status);

            sinon.assert.calledWith(
              this.serverless.cli.log,
              `Searching for ${status} migrations...`
            );
            sinon.assert.calledOnce(migrationsHandler.umzug.pending);
            sinon.assert.calledOnce(migrationsHandler.sequelize.close);

            pendingStub.restore();
          });

          it("returns pending migrations", async () => {
            const migrationsHandler = new MigrationsHandler(
              this.serverless,
              this.database
            );
            migrationsHandler.initialize();

            const migrations = [
              {
                file: "migrations1.js"
              },
              {
                file: "migrations2.js"
              },
              {
                file: "migrations3.js"
              }
            ];

            const pendingStub = sinon
              .stub(Umzug.prototype, "pending")
              .resolves(migrations);
            const consLogStub = sinon.stub(console, "log");

            const status = "pending";
            await migrationsHandler.list(status);

            sinon.assert.calledWith(
              this.serverless.cli.log,
              `Searching for ${status} migrations...`
            );
            sinon.assert.calledOnce(migrationsHandler.umzug.pending);
            sinon.assert.calledOnce(migrationsHandler.sequelize.close);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[0].file}`);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[1].file}`);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[2].file}`);

            pendingStub.restore();
            consLogStub.restore();
          });
        });

        context(`when calling with 'executed' status`, () => {
          it("returns ok if there are no executed migrations", async () => {
            const migrationsHandler = new MigrationsHandler(
              this.serverless,
              this.database
            );
            migrationsHandler.initialize();

            const executedStub = sinon
              .stub(Umzug.prototype, "executed")
              .resolves([]);

            const status = "executed";
            await migrationsHandler.list(status);

            sinon.assert.calledWith(
              this.serverless.cli.log,
              `Searching for ${status} migrations...`
            );
            sinon.assert.calledOnce(migrationsHandler.umzug.executed);
            sinon.assert.calledOnce(migrationsHandler.sequelize.close);

            executedStub.restore();
          });

          it("returns executed migrations", async () => {
            const migrationsHandler = new MigrationsHandler(
              this.serverless,
              this.database
            );
            migrationsHandler.initialize();

            const migrations = [
              {
                file: "migrations1.js"
              },
              {
                file: "migrations2.js"
              },
              {
                file: "migrations3.js"
              }
            ];

            const executedStub = sinon
              .stub(Umzug.prototype, "executed")
              .resolves(migrations);
            const consLogStub = sinon.stub(console, "log");

            const status = "executed";
            await migrationsHandler.list(status);

            sinon.assert.calledWith(
              this.serverless.cli.log,
              `Searching for ${status} migrations...`
            );
            sinon.assert.calledOnce(migrationsHandler.umzug.executed);
            sinon.assert.calledOnce(migrationsHandler.sequelize.close);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[0].file}`);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[1].file}`);
            sinon.assert.calledWith(consLogStub, `=> ${migrations[2].file}`);

            executedStub.restore();
            consLogStub.restore();
          });
        });
      });
    });
  });
});
