const _ = require("lodash");
const utils = require("./lib/utils");
const DatabaseConnectionUrlBuilder = require("./lib/databaseConnectionUrlBuilder");
const MigrationsHandler = require("./handlers/migrationsHandler");
const SequelizeCliHandler = require("./handlers/sequelizeCliHandler");

class SequelizeMigrations {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    const dbConnectionOptions = {
      dbDialect: {
        usage: "Specify the database dialect (one of: 'mysql', 'mariadb', 'postgres', 'mssql')",
        default: ''
      },
      dbHost: {
        usage: "Specify the database host",
        default: ''
      },
      dbPort: {
        usage: "Specify the database port",
        default: ''
      },
      dbName: {
        usage: "Specify the database name",
        default: ''
      },
      dbUsername: {
        usage: "Specify the database username",
        default: ''
      },
      dbPassword: {
        usage: "Specify the database password",
        default: ''
      }
    }

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
              },
              ...dbConnectionOptions
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
              },
              ...dbConnectionOptions
            }
          },
          reset: {
            usage: "Rolls back all migrations",
            lifecycleEvents: ["run"],
            options: {
              ...dbConnectionOptions
            }
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
              },
              ...dbConnectionOptions
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
    const databaseConnectionUrlBuilder = new DatabaseConnectionUrlBuilder(this.serverless, this.options);
    const database = databaseConnectionUrlBuilder.build();

    const migrationsHandler = new MigrationsHandler(
      this.serverless,
      database,
      this.path,
      this.verbose
    );

    migrationsHandler.initialize();

    return migrationsHandler;
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
