const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../src/app')

chai.should()

chai.use(chaiHttp)



describe('User Controller - Fetch Users', ()=>{

    /**
     * Test the GET API
     */
    describe(`GET "/v1/api/users" `,()=>{
       
            it("should GET all the users",(done)=>{
                chai.request(server)
                    .get("/v1/api/users")
                    .end((err,res)=>{
                        res.should.have.status(200);
                        // res.body.should.be.a('object');
                        res.body.users.should.be.a('array')
                        // res.body.users[0].should.have.property('firstname').not.eq(null || undefined)
                        done()
                    })
            })
    
            it("should NOT GET all the users",(done)=>{
                chai.request(server)
                    .get("/v1/api/user")
                    .end((err,res)=>{
                        res.should.have.status(404);
                        done()
                    })
            })
       
       

        // it("Some Internal Server error",(done)=>{
        //     chai.request(server)
        //         .get("/v1/api/users")
        //         .end((err,res)=>{
        //             res.should.have.status(500);
        //             // res.body.should.be.a('object');
        //             // res.body.users.should.not.be.a('array')
        //             // res?.body.users[0].should.have.property('firstname').not.eq(null || undefined)
        //             done()
        //         })
        // })
    })
})