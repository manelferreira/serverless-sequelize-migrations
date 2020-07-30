<h1 align="center">Serverless Sequelize Migrations</h1>

<div align="center">
  <strong>A plugin to manage sequelize migrations on serverless projects</strong>
</div>

<br />

<div align="center">
    <a href="http://www.serverless.com">
      <img src="http://public.serverless.com/badges/v3.svg">
    </a>
    <a href="https://github.com/manelferreira/serverless-sequelize-migrations/blob/master/LICENSE">
      <img src="https://img.shields.io/github/license/manelferreira/serverless-sequelize-migrations.svg">
    </a>
    <img alt="GitHub stars" src="https://img.shields.io/github/stars/manelferreira/serverless-sequelize-migrations.svg">
    <a href="https://www.npmjs.com/package/serverless-sequelize-migrations">
      <img alt="npm" src="https://img.shields.io/npm/dt/serverless-sequelize-migrations.svg?label=npm%20downloads">
    </a>
</div>

<div align="center">
  <sub>Built with :coffee: by
  <a href="https://github.com/manelferreira">Manoel Ferreira</a>
</div>
    
<br />

**Features**:
- Create migration file
- List pending and executed migrations
- Apply pending migrations
- Revert applied migrations
- Reset all applied migrations


## Documentation
- [Installation](#installation)
- [Setting up Sequelize database values](#setting-up-sequelize-database-values)
- [Usage and commmand line options](#usage-and-command-line-options)
- [Credits and inspiration](#credits-and-inspiration)
- [License](#license)


## Installation
1) Add Serverless Sequelize Migrations to your project:
```
npm install --save serverless-sequelize-migrations
```

2) Inside your serverless.yml file add the following entry to the plugins section (if there is no plugin section in the file you'll need to add it):
```
plugins:
    - serverless-sequelize-migrations
```

You can check whether the plugin is ready to be used through the terminal. To do so, type the following command on the CLI:

`serverless`

the console should display _SequelizeMigrations_  as one of the available plugins in your Serverless project.

## Setting up Sequelize

For the plugin to work correctly, you have to set the database information as environment variables on the service provider section as follows:
```
provider:
  environment:
    DB_DIALECT: 'database_dialect' /* one of 'mysql' | 'mariadb' | 'postgres' | 'mssql' */
    DB_NAME: 'database_name'
    DB_USERNAME: 'database_username'
    DB_PASSWORD: 'database_password'
    DB_HOST: 'database_host'
    DB_PORT: 'database_port'
```
or by using DB_CONNECTION_URL
```
provider:
  environment:
    DB_CONNECTION_URL: database_dialect://database_username:database_password@database_host:database_port/database_name`
```
Replace the variables with the information of your own database.

Obs: This plugin does not have support to create the database itself.

As per [Sequelize docs](http://docs.sequelizejs.com/manual/getting-started), you'll have to manually install the driver for your database of choice:

```
# One of the following:
$ npm install --save pg pg-hstore # Postgres
$ npm install --save mysql2 # MySQL
$ npm install --save mariadb # MariaDB
$ npm install --save tedious # Microsoft SQL Server
```

## Usage and command line options
To see the available commands of the plugin, run `sls migrations` on the terminal. The following should appear:
```
Plugin: SequelizeMigrations
migrations .................... Sequelize migrations management for Serverless
migrations create ............. Create a migration file
migrations up ................. Execute all pending migrations
migrations down ............... Rolls back one or more migrations
migrations reset .............. Rolls back all migrations
migrations list ............... Shows a list of migrations
    --path / -p ........................ Specify the migrations path (default is './migrations')
    --verbose / -v ..................... Shows sequelize logs
```

For any of these commands, you can specify two parameters:
- `--path` to inform the path of migrations on your project.
- `--verbose` to show sequelize execution logs during the operations.



In order to see the options of each command individually, you can run `sls migrations <command> --help` on the terminal.

The commands (those that have some option) and it's options are presented below:
- migrations create
```
--name / -n (required) ... Specify the name of the migration to be created
```

- migrations up
```
--rollback / -r .......... Rolls back applied migrations in case of error (default is false)
```

- migrations down
```
--times / -t ............. Specify how many times to roll back (default is 1)
--name / -n .............. Specify the name of the migration to be rolled back (e.g. "--name create-users.js")
```

- migrations list
```
--status / -s ............ Specify the status of migrations to be listed (--status pending [default] or --status executed)
```

### Custom migrations path
You can also define a migrations path variable on the custom section of your project service file.
```
custom:
  migrationsPath: './custom/migrations/path'
```

Important: if you inform the --path option through the CLI, this configuration will be ignored.


### Credits and inspiration
This plugin was first based on [Nevon](https://github.com/Nevon)'s [serverless-pg-migrations](https://github.com/Nevon/serverless-pg-migrations).


### License
MIT
