const _ = require("lodash");
const utils = require("./utils");

module.exports = class DatabaseConnectionUtils {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
  }

  setUpDatabaseConnectionValues() {
    utils.setEnvironment(this.serverless);
    
    let connectionUrl = process.env.DB_CONNECTION_URL;

    if (!connectionUrl) {
      connectionUrl = this.buildDatabaseConnectionUrlFromIndividualProperties();
    }

    if (!this.isDatabaseConnectionUrlValid(connectionUrl)) {
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
    } else if (!this.dbPasswordIndividualPropertyIsSet()) {
      missing = "DB_PASSWORD";
    }

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
    return this.options.dbName || process.env.DB_NAME;
  }

  getDbUsernameIndividualProperty() {
    return this.options.dbUsername || process.env.DB_USERNAME;
  }

  getDbPasswordIndividualProperty() {
    let dbPassword = this.options.dbPassword || process.env.DB_PASSWORD;

    if (!_.isNil(dbPassword))
      return dbPassword;

    return '';
  }

  dbPasswordIndividualPropertyIsSet() {
    return Object.prototype.hasOwnProperty.call(this.options, "dbPassword") 
      || Object.prototype.hasOwnProperty.call(process.env, "DB_PASSWORD");
  }

  isDatabaseConnectionUrlValid(url) {
    if (!url) 
      return false;
      
    return url.match(
      new RegExp(
        "^(mysql|mariadb|postgres|mssql)(:\\/\\/)(.*)(:)(.*@)(.*:)([0-9]*)(\\/)(.*)"
      )
    );
  }
}