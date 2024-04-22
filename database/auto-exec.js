import * as fs from 'fs';
import { connect, createConnection, query, close } from "./connection.js";
import { config } from "../config/index.js";

function getDbIndex() {
    const file = fs.readFileSync('migrations/dbindex', 'utf8');
    return file.split('\n');
}

function getSeeds() {
    const file = fs.readFileSync('seeds/dbindex', 'utf8');
    return file.split('\n');
}

async function createSelectUser() {
    const userQuery = `CREATE USER IF NOT EXISTS 'dbquery'@'localhost' IDENTIFIED BY 'Admin1111';`;
    const grantQuery = `GRANT SELECT ON dberio.* TO 'dbquery'@'localhost';`;

    await query(userQuery);
    await query(grantQuery);
}

export const autoExec = async () => {
    console.log('Auto executing migrations...');
    const migrations = getDbIndex();
    createConnection(config.db['root']); // create connection to db with root privileges
    await connect(); // connect to db

    await createSelectUser(); // create user with select privileges

    // Check if database exists
    const db = await query(`SHOW DATABASES LIKE '${config.db['query'].name}';`);
    if (db.length === 0) {
        await query(`CREATE DATABASE ${config.db['query'].name};`);
    }

    // Check if migrations table exists
    await query(`USE ${config.db['query'].name};`);
    const table = await query(`SHOW TABLES LIKE 'migrations';`);
    if (table.length === 0) {
        const createTable = `CREATE TABLE ${config.db['query'].name}.migrations
                             (
                                 id         INT AUTO_INCREMENT PRIMARY KEY,
                                 migration  VARCHAR(255) NOT NULL,
                                 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                             );`;
        await query(createTable);
    }

    for (const migration of migrations) {
        // Check if migration has been executed
        console.log('Trying to execute ', migration.trim(), '...');
        const result = await query(`SELECT *
                                    FROM migrations
                                    WHERE migration = '${migration.trim()}';`);
        if (result.length > 0) {
            console.warn('Migration already executed');
            continue;
        }

        const sql = fs.readFileSync(`migrations/${migration.trim()}`, 'utf8');
        const exec = sql.replaceAll('\r\n', '').trim();
        console.log(exec)
        await query(exec);

        // Insert migration into migrations table
        await query(`INSERT INTO migrations (migration)
                     VALUES ('${migration.trim()}');`);
        console.log('Migration executed');
    }

    console.log('Migrations executed');

    // Execute seeders
    const seeders = getSeeds();
    for (const seed of seeders) {
        const sql = fs.readFileSync(`seeds/${seed.trim()}`, 'utf8');
        const exec = sql.split('---');

        // Check if seed has been executed
        console.log('Trying to execute seed ', seed.trim(), '...');
        const result = await query(`SELECT *
                                    FROM migrations
                                    WHERE migration = '${seed.trim()}';`);
        if (result.length > 0) {
            console.warn('Seed already executed');
            continue;
        }

        for (let i = 0; i < exec.length; i++) {
            exec[i] = exec[i].replaceAll('\r\n', '').trim();
            await query(exec[i]);
        }

        // Insert seed into migrations table
        await query(`INSERT INTO migrations (migration)
                     VALUES ('${seed.trim()}');`);
    }

    console.log('Seeds executed');
}
