const Sequelize = require("sequelize");
const Umzug = require("umzug");

module.exports = class MigrationsHandler {
  constructor(serverless, database, path = "./migrations", verbose = false) {
    this.serverless = serverless;
    this.database = database;
    this.verbose = verbose;
    this.path = path;
  }

  initialize() {
    this.serverless.cli.log("Setting up connections...");
    this.sequelize = this.initSequelize();
    this.umzug = this.initUmzug();
  }

  initSequelize() {
    return new Sequelize(
      this.database.NAME,
      this.database.USERNAME,
      this.database.PASSWORD,
      {
        dialect: this.database.DIALECT,
        host: this.database.HOST,
        port: this.database.PORT,
        define: {
          freezeTableName: true
        },
        logging: this.verbose
      }
    );
  }

  initUmzug() {
    return new Umzug({
      storage: "sequelize",
      storageOptions: {
        sequelize: this.sequelize
      },
      migrations: {
        params: [
          this.sequelize.getQueryInterface(),
          this.sequelize.constructor
        ],
        path: this.path
      }
    });
  }

  async migrate(revertError = false) {
    let success = false;

    this.serverless.cli.log("Looking for pending migrations...");

    let pendingMigrations = [];
    await this.umzug.pending().then(pending => {
      pendingMigrations = [...pending.map(migration => migration.file)];
    });

    if (pendingMigrations.length > 0) {
      this.serverless.cli.log("Applying pending migrations...");

      await this.umzug
        .up()
        .then(appliedMigrations => {
          success = true;

          this.serverless.cli.log(
            `${appliedMigrations.length} applied migrations`
          );

          appliedMigrations.forEach(migration => {
            console.log(`=> ${migration.file}`);
          });
        })
        .catch(async () => {
          this.serverless.cli.log("Error while applying migrations");
          this.serverless.cli.log("Looking for migration that has problems...");

          // get all executed migrations
          let executedMigrations = [];
          await this.umzug.executed().then(executed => {
            executedMigrations = [...executed.map(migration => migration.file)];
          });

          // check pending migrations that were executed
          const executedFromPending = pendingMigrations.filter(
            pending => executedMigrations.indexOf(pending) !== -1
          );

          if (executedFromPending.length > 0) {
            this.serverless.cli.log(
              `Something wrong with ${
                pendingMigrations[executedFromPending.length]
              }`
            );

            if (revertError) {
              this.serverless.cli.log(`Reverting applied migrations...`);
              // rollback the pending migrations that were executed
              await this.umzug
                .down({
                  migrations: executedFromPending
                })
                .then(revertedMigrations => {
                  revertedMigrations.forEach(migration => {
                    console.log(`=> reverted ${migration.file}`);
                  });
                });
            }
          } else {
            this.serverless.cli.log(
              `Something wrong with ${pendingMigrations[0]}`
            );
          }
        });
    } else {
      success = true;
      this.serverless.cli.log("No pending migrations to apply");
    }

    this.sequelize.close();

    return success;
  }

  async revert(times = 1, name = null) {
    if (times < 1 && !name) throw new Error("--times must be greater than 0");

    if (name) {
      this.serverless.cli.log(`Trying to revert migration ${name}`);

      await this.umzug
        .down({
          migrations: [name]
        })
        .then(migrations => {
          this.serverless.cli.log(`${migrations.length} reverted migrations`);
          migrations.forEach(migration => {
            console.log(`=> ${migration.file}`);
          });
        });
    } else if (!name && times > 1) {
      this.serverless.cli.log(`Trying to revert the last ${times} migrations`);

      let executedMigrations = [];
      await this.umzug.executed().then(executed => {
        executedMigrations = [...executed.map(migration => migration.file)];
      });

      const rollbackMigrations = executedMigrations.reverse().slice(0, times);

      if (rollbackMigrations.length > 0) {
        console.log(rollbackMigrations);
        await this.umzug
          .down({
            migrations: rollbackMigrations
          })
          .then(migrations => {
            this.serverless.cli.log(`${migrations.length} reverted migrations`);
            migrations.forEach(migration => {
              console.log(`=> ${migration.file}`);
            });
          });
      } else {
        this.serverless.cli.log(`There isn't migrations to revert`);
      }
    } else if (!name && times === 1) {
      this.serverless.cli.log(`Trying to revert the last migration`);
      await this.umzug.down().then(migrations => {
        this.serverless.cli.log(`${migrations.length} reverted migrations`);
        migrations.forEach(migration => {
          console.log(`=> ${migration.file}`);
        });
      });
    }

    this.sequelize.close();
  }

  async reset() {
    this.serverless.cli.log(`Trying to revert all migrations...`);

    await this.umzug
      .down({
        to: 0
      })
      .then(migrations => {
        this.serverless.cli.log(`${migrations.length} reverted migrations`);
        migrations.forEach(migration => {
          console.log(`=> ${migration.file}`);
        });
      });

    this.sequelize.close();
  }

  async list(status = "pending") {
    this.serverless.cli.log(`Searching for ${status} migrations...`);

    if (status === "executed") {
      await this.umzug.executed().then(migrations => {
        this.serverless.cli.log(`${migrations.length} executed migrations`);
        migrations.forEach(migration => {
          console.log(`=> ${migration.file}`);
        });
      });
    } else {
      await this.umzug.pending().then(migrations => {
        this.serverless.cli.log(`${migrations.length} pending migrations`);
        migrations.forEach(migration => {
          console.log(`=> ${migration.file}`);
        });
      });
    }

    this.sequelize.close();
  }
};
