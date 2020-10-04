const _ = require("lodash");
const utils = require("./lib/utils");
const MigrationsHandler = require("./handlers/migrationsHandler");
const SequelizeCliHandler = require("./handlers/sequelizeCliHandler");

class SequelizeMigrations {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.commands = {
      migrations: {
        usage: "Sequelize migrations management for Serverless",
        lifecycleEvents: ["showPluginInfo"],
        options: {
          path: {
            usage: "Specify the migrations path (default is './migrations')",
            shortcut: "p",
            default: "./migrations"
          },
          verbose: {
            usage: "Shows sequelize logs",
            shortcut: "v"
          }
        },
        commands: {
          create: {
            usage: "Create a migration file",
            lifecycleEvents: ["run"],
            options: {
              name: {
                usage: "Specify the name of the migration to be created",
                shortcut: "n",
                required: true
              }
            }
          },
          up: {
            usage: "Execute all pending migrations",
            lifecycleEvents: ["run"],
            options: {
              rollback: {
                usage:
                  "Rolls back applied migrations in case of error (default is false)",
                shortcut: "r",
                default: false
              }
            }
          },
          down: {
            usage: "Rolls back one or more migrations",
            lifecycleEvents: ["run"],
            options: {
              times: {
                usage: "Specify how many times to roll back (default is 1)",
                shortcut: "t",
                default: 1
              },
              name: {
                usage:
                  'Specify the name of the migration to be rolled back (e.g. "--name create-users.js")',
                shortcut: "n"
              }
            }
          },
          reset: {
            usage: "Rolls back all migrations",
            lifecycleEvents: ["run"]
          },
          list: {
            usage: "Shows a list of migrations",
            lifecycleEvents: ["show"],
            options: {
              status: {
                usage:
                  "Specify the status of migrations to be listed (--status pending [default] or --status executed)",
                shortcut: "s",
                default: "pending"
              }
            }
          }
        }
      }
    };

    this.hooks = {
      "migrations:showPluginInfo": this.showPluginInfo.bind(this),
      "migrations:up:run": this.migrate.bind(this),
      "migrations:down:run": this.revert.bind(this),
      "migrations:reset:run": this.reset.bind(this),
      "migrations:list:show": this.list.bind(this),
      "migrations:create:run": this.createMigration.bind(this)
    };

    this.verbose = this.options.verbose || this.options.v;
    this.path =
      this.options.path ||
      this.options.p ||
      _.get(this.serverless, "service.custom.migrationsPath");
  }

  showPluginInfo() {
    this.serverless.cli.generateCommandsHelp(["migrations"]);
  }

  setUpMigrationsHandler() {
    const database = this.setUpDatabaseConnectionValues();

    const migrationsHandler = new MigrationsHandler(
      this.serverless,
      database,
      this.path,
      this.verbose
    );

    migrationsHandler.initialize();

    return migrationsHandler;
  }

  setUpDatabaseConnectionValues() {
    utils.setEnvironment(this.serverless);

    let connectionUrl = process.env.DB_CONNECTION_URL;

    if (!connectionUrl) {
      connectionUrl = this.buildDatabaseConnectionUrlFromIndividualProperties();
    }

    if (!utils.isDatabaseConnectionUrlValid(connectionUrl)) {
      this.serverless.cli.log(
        `Database connection settings are invalid or results in malformed connection URL: ${connectionUrl}`
      );
      process.exit(1);
    }

    return {
      CONNECTION_URL: connectionUrl
    };
  }

  buildDatabaseConnectionUrlFromIndividualProperties() {
    let missingProperty = this
      .checkForMissingDatabaseConnectionIndividualProperties();

    if (missingProperty) {
      this.serverless.cli.log(`Missing ${missingProperty} in the environment variables`);
      process.exit(1);
    }

    const connectionProperties = {
      DIALECT: this.getDbDialectIndividualProperty(),
      HOST: this.getDbHostIndividualProperty(),
      PORT: this.getDbPortIndividualProperty(),
      NAME: this.getDbNameIndividualProperty(),
      USERNAME: this.getDbUsernameIndividualProperty(),
      PASSWORD: this.getDbPasswordIndividualProperty()
    };

    return `${connectionProperties.DIALECT}`
      + `://${connectionProperties.USERNAME}`
      + `:${connectionProperties.PASSWORD}`
      + `@${connectionProperties.HOST}`
      + `:${connectionProperties.PORT}`
      + `/${connectionProperties.NAME}`;
  }

  checkForMissingDatabaseConnectionIndividualProperties() {
    let missing = false;

    if (!this.getDbDialectIndividualProperty()) {
      missing = "DB_DIALECT";
    } else if (!this.getDbHostIndividualProperty()) {
      missing = "DB_HOST";
    } else if (!this.getDbPortIndividualProperty()) {
      missing = "DB_PORT";
    } else if (!this.getDbNameIndividualProperty()) {
      missing = "DB_NAME";
    } else if (!this.getDbUsernameIndividualProperty()) {
      missing = "DB_USERNAME";
    } else if (!this.getDbPasswordIndividualProperty()) {
      missing = "DB_PASSWORD";
    }

    // !Object.prototype.hasOwnProperty.call(process.env, "DB_PASSWORD")

    return missing;
  }

  getDbDialectIndividualProperty() {
    return this.options.dbDialect || process.env.DB_DIALECT;
  }

  getDbHostIndividualProperty() {
    return this.options.dbHost || process.env.DB_HOST;
  }

  getDbPortIndividualProperty() {
    return this.options.dbPort || process.env.DB_PORT;
  }

  getDbNameIndividualProperty() {
    return this.options.DbName || process.env.DB_NAME;
  }

  getDbUsernameIndividualProperty() {
    return this.options.dbUsername || process.env.DB_USERNAME;
  }

  getDbPasswordIndividualProperty() {
    return this.options.dbPassword || process.env.DB_PASSWORD;
  }

  async migrate() {
    try {
      const migrationsHandler = this.setUpMigrationsHandler();

      const success = await migrationsHandler.migrate(this.options.rollback);
      if (!success) process.exit(1);
    } catch (e) {
      this.serverless.cli.log(`Error trying to apply migrations: \n${e}`);
      process.exit(1);
    }
  }

  async revert() {
    try {
      const migrationsHandler = this.setUpMigrationsHandler();

      await migrationsHandler.revert(this.options.times, this.options.name);
    } catch (e) {
      this.serverless.cli.log(`Error trying to rollback migrations: \n${e}`);
      process.exit(1);
    }
  }

  async reset() {
    try {
      const migrationsHandler = this.setUpMigrationsHandler();

      await migrationsHandler.reset();
    } catch (e) {
      this.serverless.cli.log(`Error trying to revert all migrations: \n${e}`);
      process.exit(1);
    }
  }

  async list() {
    try {
      const migrationsHandler = this.setUpMigrationsHandler();

      await migrationsHandler.list(this.options.status);
    } catch (e) {
      this.serverless.cli.log(`Error trying to list migrations: \n${e}`);
      process.exit(1);
    }
  }

  setUpSequelizeCliHandler() {
    return new SequelizeCliHandler(this.serverless, this.path);
  }

  createMigration() {
    try {
      const sequelizeCliHandler = this.setUpSequelizeCliHandler();

      sequelizeCliHandler.createMigration(this.options.name);
    } catch (e) {
      this.serverless.cli.log(`Error trying to create migration: \n${e}`);
      process.exit(1);
    }
  }
}

module.exports = SequelizeMigrations;
