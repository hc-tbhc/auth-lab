## Database setup

PostgreSQL

Create a development database and test database in PostgreSQL.

Create a `users` table in each database using the table definition in `db/schema.sql`.

In the development database, create a role that can make SELECT, INSERT, UPDATE and DELETE requests to the `users` table.

In the test database, create a role and give it ownership of the `users` table.

Create a .env.development file which should contain:

DB_HOST=localhost
DB_NAME=auth_lab
DB_USER=your_database_role
DB_PASSWORD=your_database_password
DB_PORT=5432

to allow the application to connect to the development database, and .env.test file with the same values, but for the corresponding test database and test role.

## Application setup

First, run `npm install` in the terminal.

To run the test suite, run `npm test` in the terminal.