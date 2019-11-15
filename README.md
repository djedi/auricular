# Auricular

This a project to create a simple audiobook library to house all my audiobooks. Currently it only supports M4B files since they are my preferred format. I've tried to build this out in a what to make it easier for full-stack developers to contribute to by getting it up and running in Docker.

## Using Docker

In the root of this directory, map an environment variable to point to your audiobooks. For example:
`echo AUDIOBOOK_DIR=/Users/yourname/Audiobooks > .env`

Start docker containers:
`docker-compose up -d`

This should build and start the docker containers needed for this project, which are:

- postgres
- [Hasura](https://hasura.io/) - GraphQL that connects to the postgres db. Access it at http://localhost:8081/
- api - Node/Express API more for working with M4B files. Access it at http://localhost:8082/
- [Aurelia](https://aurelia.io) - front-end framework for UI/UX. Access it at http://localhost:8083/

## Loading Data

Populate postgresql with the attached sql dump
`TODO:`

Run the scan.js script to populate the database with your audiobook files.
`docker exec -it auricular_api_1 node scan.js`

scan.js will scan the specifed directory for .m4b files, and insert audiobook information in the db. Now you're ready to run the UI.

## Running the UI

Go to http://localhost:8083/

Note that live reload is enabled for both the API and the Aurelia, so making changes should updated things automatically.

## Other useful command

Stop all the containers
`docker-compose down`

Backup db
`docker exec -t auricular_postgres_1 pg_dumpall -c -U postgres > dump.sql`

Restore db
`cat dump.sql | docker exec -i auricular_postgres_1 psql -U postgres`

Remove db_data volume (rm containers first)
`docker volume rm auricular_db_data`

Restart a container
`docker-compose restart api`

# TODO

- Upload audiobook
- Wire up watch.js
- Refactor scanner to use shared code in watch.js
- Edit m4b metadata tags
- Edit chapter names
- Add chapter breaks
- Dockerize deploy
- Fix hard-coded localhost api calls
