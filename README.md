___Note: as of the current release, only mysql database is supported. But support for other databases has been planned.___

# Description
A simple database role and permission management tool, which can backup role and permissions in given database, import permission definitions to given database, and export roles and permissions from the given database.

# Use Case
In application which uses role based access control, typically with tables in database as below:

## role
```
+----------------+--------------+------+-----+---------+----------------+
| Field          | Type         | Null | Key | Default | Extra          |
+----------------+--------------+------+-----+---------+----------------+
| id             | int(11)      | NO   | PRI | NULL    | auto_increment |
| name           | char(32)     | NO   |     | NULL    |                |
| display_name   | varchar(64)  | NO   |     | NULL    |                |
| description    | varchar(100) | YES  |     | NULL    |                |
| sort_order     | int(11)      | NO   |     | NULL    |                |
| is_system_role | tinyint(1)   | NO   |     | NULL    |                |
+----------------+--------------+------+-----+---------+----------------+
```

## permission
```
+-------------+--------------+------+-----+---------+----------------+
| Field       | Type         | Null | Key | Default | Extra          |
+-------------+--------------+------+-----+---------+----------------+
| id          | int(11)      | NO   | PRI | NULL    | auto_increment |
| name        | varchar(100) | NO   | UNI | NULL    |                |
| text        | varchar(100) | NO   |     | NULL    |                |
| category_id | int(11)      | YES  | MUL | NULL    |                |
| sort_order  | int(11)      | NO   |     | NULL    |                |
+-------------+--------------+------+-----+---------+----------------+
```

## role_permission
```
+---------------+---------+------+-----+---------+-------+
| Field         | Type    | Null | Key | Default | Extra |
+---------------+---------+------+-----+---------+-------+
| role_id       | int(11) | NO   | PRI | NULL    |       |
| permission_id | int(11) | NO   | PRI | NULL    |       |
+---------------+---------+------+-----+---------+-------+
```


# Install & Usage
perman is a CLI tool that could be installed via npm as below:
```bash
  npm install -g node-perman
```

___Note: this tool requires nodejs version 4.0.0 or above.___

Then, type `perman --help` to see how to use it as below:

```
Usage: perman <command> [options]

Commands:
  backup  backup permissions in the configured database
  import  import the permissions to the configured database
  export  export the permissions to file in given format
  change  generate change scripts of the permissions

Options:
  -c, --config  the configurations to use with perman
  -o, --out     output file path when used w/ export and change command
  --log-level   logging level: verbose (default), debug, info, warn, error
  --help        show help information
  --version     Show version number

Copyright 2015, MIT licensed.
```

You have to create a configuration file for the databases that you want to add perman support to.
Basically, you can use `--config` option or `.permanrc` in the working directory to specify the required configurations. The config file supports _YAML_, _JSON_ and _node module_ formats whichever way you choose for that. See the sample configuration files below.

## Import
First, use the `import` command to import permission definitions to database, e.g.,
```bash
perman import --config /path/to/the/config/file
```
or without the `--config` option if there is a `.permanrc` configuration file in the directory you're calling perman:
```bash
perman import
```

## Export


## Backup
By rebasing, perman will treat the current database as a fresh new one and re-integrate w/ it from a new start point. You can rebase the database at any time you want by using the `init` command with `--force	` option:
```bash
perman init --config /path/to/the/config/file --force
```
or without the `--config` option if there is a `.permanrc` configuration file in the directory you're calling perman:
```bash
perman init --force
```

# Sample config files

## YAML
```yaml
# database configuration
dialect: mysql
host: 127.0.0.1
port: 3306
user: root
password: pwd01!
database: kingboss


# permissions definition file path
permissions: ./conf/permissions.conf

# table names of roles, permissions, and their associations
tables:
  roles: role
  permissions: permission
  permission_categories: permission_category
  associations: role_permission


```

## JSON
```json
{
  "dialect": "mysql",
  "database": "kingboss",
  "host": "127.0.0.1",
  "tables": {
    "associations": "role_permission",
    "permission_categories": "permission_category",
    "roles": "role",
    "permissions": "permission"
  },
  "permissions": "./conf/permissions.conf",
  "password": "pwd01!",
  "port": 3306,
  "user": "root"
}
```


## Node Module
```js
var path = require('path');
module.exports = {
  "dialect": "mysql",
  "database": "kingboss",
  "host": "127.0.0.1",
  "tables": {
    "associations": "role_permission",
    "permission_categories": "permission_category",
    "roles": "role",
    "permissions": "permission"
  },
  "permissions": "./conf/permissions.conf",
  "password": "pwd01!",
  "port": 3306,
  "user": "root"
};

```

# CHANGELOG
[CHANGELOG](./CHANGELOG.md)

# License
[MIT License](./LICENSE)
