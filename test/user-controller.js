const chai = require('chai')
const chaiHttp = require('chai-http')
const server = require('../src/app')

chai.should()

chai.use(chaiHttp)



describe('User Controller - Fetch Users Information', ()=>{

    /**
     * Test the GET route
     */
    describe(`GET "/v1/api/users" `,()=>{
       
            it("should GET all the users",(done)=>{
                chai.request(server)
                    .get("/v1/api/users")
                    .end((err,res)=>{
                        res.should.have.status(200);
                        res.body.should.have.property('message').eql('Fetched User Successfully.')
                        res.body.users[0].should.have.property('userId');
                        res.body.users[0].should.have.property('online');
                        res.body.users[0].should.have.property('offline');
                        res.body.users[0].should.have.property('totalNodes');
                        res.body.users[0].should.have.property('mobile');
                        res.body.users[0].should.have.property('manual');
                        res.body.users[0].should.have.property('voice');
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

    /**
     * Test the POST route
     */
    describe(`POST "/v1/api/users/nodes"`, () => {

        
        it('should returns all nodes details that user has', (done) => {
            let userID = {
                "userId": ["US_40816709-f54f-4d34-9f2d-07f4c4214087"]
              }
            
            chai.request(server)
                .post("/v1/api/users/nodes")
                .send(userID)
                .end((err,res) => {
                    res.should.have.status(200);
                    res.body.usersDetails.should.be.a('array')
                    res.body.should.have.property('message').eql('Fetched User Successfully.')
                    res.body.usersDetails[0].should.have.property('nodes');
                    res.body.usersDetails[0].nodes.should.be.a('array')
                    res.body.usersDetails[0].nodes[0].should.have.property('nodeId');
                    res.body.usersDetails[0].nodes[0].should.have.property('status');
                    res.body.usersDetails[0].nodes[0].should.have.property('lastOnline');
                    done()
                })
        })
    })


    describe(`POST /v1/api/users/nodes/details`,() => {

        it('should not return timestamp, status of node and reset node count without master ID',(done)=>{
            let masterID = {
                
            } 
            chai.request(server)
                .post("/v1/api/users/nodes/details")
                .send(masterID)
                .end((err,res)=>{
                    res.should.have.status(404);
                    res.body.should.be.a('object')
                    res.body.should.have.property('error').eql('masterId or Data could not fetch')
                    done()
                })
        })



        it('should return timestamp, status of node and reset node count',(done)=>{
            let masterID = {
                "masterId": [
                 "MS_6d26d63b-dfc2-4430-9a5c-618e86dd4e2e"
                ]
            } 
            chai.request(server)
                .post("/v1/api/users/nodes/details")
                .send(masterID)
                .end((err,res)=>{
                    res.should.have.status(200);
                    res.body.should.have.property('message').eql('Fetched User Successfully.')
                    res.body.usersDetails[0].should.have.property('timeStamp');
                    res.body.usersDetails[0].timeStamp.should.be.a('array')
                    res.body.usersDetails[0].should.have.property('status');
                    res.body.usersDetails[0].status.should.be.a('array')
                    res.body.usersDetails[0].should.have.property('NodeResetTime');
                    res.body.usersDetails[0].NodeResetTime.should.be.a('array')
                    res.body.usersDetails[0].should.have.property('resetCount')
                    done()
                })
        })
    })
})


/**
* Test the LIVE DEMO API
*/
describe('TRY LIVE DEMO',() => {
    describe(`POST /v1/api/users/demo`,() => {

        //if cookies is not exists
        it('should not return Count of users that visited our site without cookie',(done)=>{
            let cookies = {
                
            }
            chai.request(server)
                .post("/v1/api/users/demo")
                .send(cookies)
                .end((err,res)=>{
                    res.should.have.status(400);
                    res.body.should.be.a('object')
                    res.body.should.have.property('error').eql('cookies are required')
                    done()
                })
        })


        it('should return Count of users that visited our site with cookie',(done)=>{
            let cookies = {
                cookie:"cd8d6686-1685-c69a-14f7-9eb401df3253"
            }
            chai.request(server)
                .post("/v1/api/users/demo")
                .send(cookies)
                .end((err,res)=>{
                    res.should.have.status(200);
                    res.body.should.be.a('object')
                    res.body.should.have.property('message').eql('Fetched Data Successfully.')
                    res.body.should.have.property('totalUser');
                    res.body.should.have.property('totalVisited');
                    done()
                })
        })
    })


    describe(`POST ​/demo/try/:endpointId/:status`,()=>{

        //session timeout logic test
        it('should not operate device without cookie',(done) => {
            const endpointId = "EP_c624aa54-83d6-4128-ad1e-f17e6c2d3e9a"
            const status =  0
            let cookies = {
                
            }
            chai.request(server)
                .post(`/v1/api/users/demo/try/${endpointId}/${status}`)
                .send(cookies)
                .end((err,res)=>{
                    res.should.have.status(401);
                    res.body.should.be.a('object')
                    res.body.should.have.property('error').eql('May be Session Timeout Or Something Else')
                    done()
                })
        })

        it('should operate device and how How many users try our demo',(done) => {
            const endpointId = "EP_c624aa54-83d6-4128-ad1e-f17e6c2d3e9a"
            const status =  0
            let cookies = {
                cookie:"cd8d6686-1685-c69a-14f7-9eb401df3253"
            }
            chai.request(server)
                .post(`/v1/api/users/demo/try/${endpointId}/${status}`)
                .send(cookies)
                .end((err,res)=>{
                    res.should.have.status(200);
                    res.body.should.be.a('object')
                    res.body.should.have.property('message').eql('Operate Successfully.')
                    res.body.should.have.property('totalOperations');
                    res.body.should.have.property('timeDuration');
                    res.body.should.have.property('status');
                    done()
                })
        })
    })
})


