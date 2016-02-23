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
`TBD`

## Backup
By backinng up, perman will backup all role and permission related data to the configured backup path:
```bash
perman backup --config /path/to/the/config/file
```
or without the `--config` option if there is a `.permanrc` configuration file in the directory you're calling perman:
```bash
perman backup
```

## Change Scripts
By backinng up, perman will generate the sql scripts used to update the roles and permissions. Then you can integrate the change scripts w/ your database version control tool or execute the scripts manually:
```bash
perman change --config /path/to/the/config/file --out /path/to/the/change-script/file or
perman change --config /path/to/the/config/file > /path/to/the/change-script/file
```
or without the `--config` option if there is a `.permanrc` configuration file in the directory you're calling perman:
```bash
perman change --out /path/to/the/change-script/file or
perman change > /path/to/the/change-script/file
```

# Sample config files

__NOTE__: default table names will used if they're not specified in the config file. 
## YAML
```yaml
# database configuration
dialect: mysql
host: 127.0.0.1
port: 3306
user: user
password: password
database: name


# permissions definition file path
permissions: ./conf/permissions.conf

# table names of roles, permissions, and their associations
# default names will be used if not configured.
tables:
  roles: role
  permissions: permission
  permission_categories: permission_category
  associations: role_permission

# others
backup_path: ./backups
```

## JSON
```json
{
  "dialect": "mysql",
  "database": "name",
  "backup_path": "./backups",
  "host": "127.0.0.1",
  "tables": {
    "associations": "role_permission",
    "permission_categories": "permission_category",
    "roles": "role",
    "permissions": "permission"
  },
  "permissions": "./conf/permissions.conf",
  "password": "password",
  "port": 3306,
  "user": "user"
}
```


## Node Module
```js
var path = require('path');
module.exports = {
  dialect: 'mysql',
  database: 'name',
  backup_path: './backups',
  host: '127.0.0.1',
  tables: {
    'associations': 'role_permission',
    'permission_categories': 'permission_category',
    'roles': 'role',
    'permissions': 'permission'
  },
  permissions: path.join(__dirname, './conf/permissions.conf'),
  password: 'password',
  port: 3306,
  user: 'user'
};

```

# Permission definitions example
You define the permissions in the following format:
```
c1
  - p_1_1/id_p_1_1
c2
  - p_2_1/id_p_2_1
  c2_1
    c2_1_1
      c2_1_1_1
        - p2_1_1_1_1/id_p2_1_1_1_1
      c2_1_1_2
        - p2_1_1_2_1/id_p2_1_1_2_1
        - p2_1_1_2_2/id_p2_1_1_2_2
    c2_1_2
      c2_1_2_1
        - p2_1_2_1_1/id_p2_1_2_1_1
        - p2_1_2_1_2/id_p2_1_2_1_2
  c2_2
    c2_2_1
      - p2_2_1_1/id_p2_2_1_1
      c2_2_1_1
        - p2_2_1_1_1/id_p2_2_1_1_1
        - p2_2_1_1_2/id_p2_2_1_1_2
      - p2_2_1_2/id_p2_2_1_2
      - p2_2_1_3/id_p2_2_1_3
    - p2_2_1/id_p2_2_1
    - p2_2_2/id_p2_2_2
      c2_1_1_2
        - p2_2_1_2_1/id_p2_2_1_2_1
        - p2_2_1_2_2/id_p2_2_1_2_2
        - p2_2_1_2_3/id_p2_2_1_2_3
```
where a line that is not leaded by a dash (-) represents a permission category,
and a line that begins w/ a dash (-) represents a permission which is defined as
`permission_name/permission_id`, e.g., `create some object/create_some_object`.

__IMPORTANT NOTE: please indent each line w/ SPACES instead of TABS. __

# CHANGELOG
[CHANGELOG](./CHANGELOG.md)

# License
[MIT License](./LICENSE)
