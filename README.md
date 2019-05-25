# Serverless Sequelize Migrations

This is a plugin for Serverless framework that allows you to handle your sequelize migrations.

**Features**:
- Create migration file
- List pending and executed migrations
- Apply pending migrations
- Revert applied migrations
- Reset all applied migrations


## Documentation
- [Installation](#Installation)
- [Setting up Sequelize database values](#Setting)
- [Usage and commmand line options](#Usage)


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

You can check wether the plugin is ready to be used through the terminal. To do so, type the following command on the CLI:

`serverless`

the console should display _SequelizeMigrations_  as one of the available plugins in your Serverless project.

## Setting up Sequelize database values

For the plugin to work correctly, you have to inform the database information as environment variables on the service provider section as follows:
```
provider:
  environment:
    DB_DIALECT: 'mysql' // or any other
    DB_NAME: 'database_name'
    DB_USERNAME: 'database_username'
    DB_PASSWORD: 'database_password'
    DB_HOST: 'database_host'
    DB_PORT: 'database_port'
```
Replace the variables with the information of your own database.

Obs: This plugin does not have support to create the database itself.


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


### Credits and inspiration
This plugin was first based on [Nevon](https://github.com/Nevon)'s [serverless-pg-migrations](https://github.com/Nevon/serverless-pg-migrations).


### License
MIT
