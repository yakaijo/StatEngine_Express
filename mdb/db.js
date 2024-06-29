//mongo db driver import
const {MongoClient} = require ('mongodb')

let dbConnection

module.exports = {
    //connects to database
    connectToDb: (cb) => {
        // MongoClient.connect("mongodb://127.0.0.1:27017/testdb")
        // below is the mongodb cloud-based
        MongoClient.connect("mongodb+srv://mainuser:Z4zTd7YBor9Txrxm@csgo-database.l6hsda9.mongodb.net/") 
        .then((client) => {
            dbConnection = client.db()
            return cb()
        })
        .catch(err => {
            console.log(err)
            return cb(err)
        })
    },
    //retrieves connection database
    getDb: () => dbConnection
}