//Using mySQL
// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete',
//     password: 'root'
// });

// module.exports = pool.promise();

//Using sequelize
// const Sequelize = require('sequelize');

// const sequelize = new Sequelize('node-complete', 'root', 'root', {
//     dialect: 'mysql', 
//     host: 'localhost'
// });

// module.exports = sequelize;

//Using mongodb
const mongodb = require('mongodb');
const MongoClient = mongodb.MongoClient;

let _db;

const mongoConnect = (callback) => {
    MongoClient.connect('mongodb://localhost:27017')
    .then(client => {
        console.log('Connected!');
        _db = client.db();
        callback();
    })
    .catch(err => {
        console.log(err);
        throw err;
    }); 
};

const getDb = () => {
    if(_db) {
        return _db;
    }
    throw 'No database found!';
};

// module.exports = mongoConnect;

exports.mongoConnect = mongoConnect;
exports.getDb = getDb;
