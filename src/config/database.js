
const path = require('path');

const sqlite3 = require('sqlite3').verbose();


const dbPath = path.join(__dirname,'../', process.env.DB_PATH)


let db = new sqlite3.Database(dbPath,(err)=>{
                    if(err){
                        return console.error(err.message);
                    }
                    console.log(`Connected to the SQlite database`);
                })
                
module.exports = db

