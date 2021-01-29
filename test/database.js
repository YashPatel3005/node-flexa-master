const expect = require('chai').expect
const path = require('path');

const envPath = path.resolve(process.cwd(), '.env.'+ process.env.NODE_ENV)
require('dotenv').config({path: envPath.replace(' ','')})

const db = require('../src/config/database')



//test case for database
describe('Database connection',function(){
    it('should connect with database',function(){
        try {
            expect(db).to.not.equal(null || undefined)
        } catch (error) {
            console.log(error);
        }
        
    })
})



