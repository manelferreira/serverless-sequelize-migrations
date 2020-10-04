const { expect } = require("chai");
const sinon = require("sinon");
const DatabaseConnectionUrlBuilder = require("../lib/databaseConnectionUrlBuilder");

describe("DatabaseConnectionUrlBuilder", () => {
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        builder.build();
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

            const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

            const database = builder.build();

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

            const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

            const database = builder.build();

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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, {});

        const database = builder.build();

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

            const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);

            const database = builder.build();

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

            const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);

            const database = builder.build();

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

        const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);

        const database = builder.build();

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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
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

          const builder = new DatabaseConnectionUrlBuilder(this.serverless, cliOptionsDbData);
  
          const database = builder.build();
  
          expect(database).to.be.eql({
            CONNECTION_URL: `${this.envDbData.DB_DIALECT}://${this.envDbData.DB_USERNAME}:${cliOptionsDbData.dbPassword}@${this.envDbData.DB_HOST}:${this.envDbData.DB_PORT}/${this.envDbData.DB_NAME}`
          });
        });
      });
    })
  });
});
