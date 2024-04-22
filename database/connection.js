import mysql from 'mysql';

let connection = null;

function createConnection(config) {
    connection = mysql.createConnection(config);
}

async function connect() {
    return new Promise((resolve, reject) => {
        connection.connect((err) => {
            if (err) {
                reject(err);
            }
            resolve('Connected to database');
        });
    });
}

async function close() {
    return new Promise((resolve, reject) => {
        connection.end((err) => {
            if (err) {
                reject(err);
            }
            resolve('Connection closed');
        });
    });
}

async function query(sql, isRoot = false) {
    return new Promise((resolve, reject) => {
        connection.query(sql, (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(result);
        });
    });
}

export { createConnection, connect, query, close };