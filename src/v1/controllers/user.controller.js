var moment = require('moment'); // require
moment().format(); 

const { v4: uuid4 } = require('uuid')
const Promise = require('bluebird');
const axios = require('axios')

const db = Promise.promisifyAll(require('../../config/database'))

exports.getUsers = async function(req,res,next){
    try {     
        const sql = `SELECT userId,email,online,offline,totalNodes,nodeMacId FROM	
                    (SELECT 
                         user.userId as userId, user.email as email,
                         sum(case when Node.status = "1" then "1" else "0" end) as online,
                         sum(case when Node.status = "0" then "1" else "0" end) as offline,
                         COUNT(Node.nodeId) as totalNodes,
                         Node.nodeId as nodeId,
                         Node.masterId as masterId,
                         Mastertable_node.nodeMacId as nodeMacId 
                     FROM user 
                         LEFT OUTER JOIN UserInstallationLink ON UserInstallationLink.userId = user.userId
                         LEFT OUTER JOIN RoomID ON UserInstallationLink.installationId = RoomID.installationId
                         LEFT OUTER JOIN Node ON Node.roomId = RoomID.roomId 
                         LEFT OUTER JOIN Mastertable_node ON Mastertable_node.masterId = Node.masterId
                     GROUP by user.userId)`
        const userInfo = await db.allAsync(sql)
        
        for(let i=0;i<userInfo.length;i++){
            const sql1 = `SELECT	
                                    COUNT(CASE WHEN uniqueId="MQTT00" then 1  WHEN uniqueId="REST" then 1 ELSE NULL END) as mobile,
                                    COUNT(CASE WHEN uniqueId="MANUAL" then 1 ELSE NULL END) as manual,
                                    COUNT(CASE WHEN uniqueId="MQTT00" then NULL  WHEN uniqueId="REST" then NULL WHEN uniqueId="MANUAL" then NULL ELSE 1 END) as voice
                                    FROM MQTTDimmerResponse
                
                                    WHERE nodeMacId='${userInfo[i].nodeMacId}'`
            data = await db.allAsync(sql1)
            
            userInfo[i] = {
                ...userInfo[i],
                ...data[i]
            }
            delete userInfo[i].nodeMacId;
        }    
        
        if(!userInfo){
            return res.status(404).json({Message:'User Data not Found!!'})
        }
    return res.status(200).json({message:'Fetched User Successfully.',users:userInfo}) 
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        res.status(err.status).json({message:'Internal Server Error'})
        next(err); 
    }
    db.close()
}

exports.getUsersNodes = async function(req,res,next){
    try {
        const userID = req.body.userId
        ///if userID is not array format
        if(!Array.isArray(userID)){
            return res.status(500).json({Message:'Something went wrong!!'})
        }
        const ids = new Array(userID.length).fill('?').join(',') 

        const sql = `SELECT 
                        user.userId as userId, 
                        user.email as email,
                        nodeId as nodeId,
                        Node.status,
                        CASE WHEN Node.status = "0" THEN Node.last_alive_on ELSE "online" END as lastOnline
                        
                        FROM user 
		
                        LEFT OUTER JOIN UserInstallationLink ON UserInstallationLink.userId = user.userId
                        LEFT OUTER JOIN RoomID ON UserInstallationLink.installationId = RoomID.installationId
                        LEFT OUTER JOIN Node ON Node.roomId = RoomID.roomId
                    
                    WHERE user.userId IN (${ids}) AND Node.nodeId IS NOT NULL`
        const userDetail = await db.allAsync(sql,userID)
       
        let result = []
        
        for(let i=0;i<userID.length;i++){
            let usrIds = userDetail.filter(e => e.userId === userID[i])
           
            let userData = usrIds.map((d)=>({nodeId:d.nodeId, status: d.status, lastOnline: d.lastOnline}))

            const usr = {
                        'userId':usrIds[i].userId,
                        'email':usrIds[i].email,
                        'nodes':userData
            }
            result.push(usr)
        }
        if(!result){
            return res.status(404).json({Message:'User Data not Found!!'})
        }
        return res.status(200).json({message:'Fetched User Successfully.',usersDetails:result}) 
 
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        res.status(err.status).json({message:'Internal Server Error'})
        next(err); 
    }
    db.close()
}


exports.getNodesDetails = async function (req,res,next){
    try {
        const masterID = req.body.masterId
        //to get a timestamp from MQTTAliveResponce table
        const sql1 = `SELECT 
                        Node.masterId,
                        Mastertable_node.nodeMacId,
                        MQTTAliveResponse.timestamp
                        
		            FROM 
	                    Node
                    LEFT OUTER JOIN Mastertable_node ON Mastertable_node.masterId = Node.masterId
                    LEFT OUTER JOIN MQTTAliveResponse ON MQTTAliveResponse.nodeMacId = Mastertable_node.nodeMacId
		
                    WHERE  Node.masterId = '${masterID}' AND MQTTAliveResponse.timestamp BETWEEN datetime('now', '-10 days') AND datetime('now', 'localtime')
                    ORDER BY MQTTAliveResponse.timestamp desc`
        const data = await db.allAsync(sql1)
        
        //if data is not found
        if(data.length <= 0){
            return res.status(404).json({errorMessage:'masterId or Data could not fetch'})
        }

        //to get reset count of node
        const sql2 = `SELECT 
                        ResetNode.NodeResetTime
                    FROM 
                         Node
                    LEFT OUTER JOIN Mastertable_node ON Mastertable_node.masterId = Node.masterId
                    LEFT OUTER JOIN ResetNode ON ResetNode.nodeMacId = Mastertable_node.nodeMacId
                    
                    WHERE NodeResetTime IS NOT NULL AND Node.masterId = '${masterID}'
                    ORDER BY ResetNode.NodeResetTime DESC`
        const data1 = await db.allAsync(sql2)
        

        const result = []
        
        for(let i=0;i<masterID.length;i++){ 
            let masterIds = data.filter(e => e.masterId === masterID[i])
           
            let masterData = masterIds.map((d)=>([d.timestamp]))
            let timeStampArr = Array.prototype.concat(...masterData)
            
            let allDate = []
            for(let j=0;j<timeStampArr.length;j++){
                let d = timeStampArr[j].slice(0,timeStampArr[j].lastIndexOf(":"))
                allDate.push(d)
            }

            let uniqueDate = [...new Set(allDate)]
            
           
            let status = []

            for(let i=0;i<uniqueDate.length;i++){
                if(i == 0){
                    status.push(1)
                }
                else{
                    let currDate = moment(uniqueDate[i]).valueOf()
                    let prevDate = moment(uniqueDate[i-1]).valueOf()
                    if(( prevDate - currDate ) < 90000){
                        status.push(1)
                    }
                    else{    
                        status.push(0)
                       
                    }
                }
            }
        

            let resetData = data1.map((d)=>([d.NodeResetTime]))
            let resetTimeArr = Array.prototype.concat(...resetData)
            
            const master = {
                  'masterId':data[i].masterId,
                  'nodeMacId':data[i].nodeMacId,
                  'timeStamp':uniqueDate,
                  'status':status,
                  'NodeResetTime':resetTimeArr,
                  'resetCount': resetTimeArr.length
                    
            }
            result.push(master)
        }
        if(!result){
            return res.status(404).json({Message:'User Data not Found!!'})
        }
        return res.status(200).json({message:'Fetched User Successfully.',usersDetails:result}) 
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        res.status(err.status).json({message:'Internal Server Error'})
        next(err); 
    }
    db.close()
}

exports.getSessionId = async function(req,res,next){
    try {
        //count how many times user visit our site 
        const visitorCount = await db.allAsync(`SELECT * FROM count`)
        visitorCount[0].visitorCount += 1
        await db.runAsync(`UPDATE count SET visitorCount = ${visitorCount[0].visitorCount}`)


        const cookies = req.body.cookie
        console.log(cookies);

        const cookieData = await db.allAsync(`SELECT uuid FROM session WHERE uuid = '${cookies}'`)
        console.log(cookieData);
        
        if(cookieData.length <= 0){
            //count how many user visit our site 
            await db.runAsync(`INSERT INTO session(uuid) VALUES('${cookies}')`)
        }
       
       
        const countUser = await db.allAsync('SELECT COUNT(uuid) as countUser FROM session') 
        
        return res.status(200).json({message:'Fetched Data Successfully.',totalUser:countUser[0].countUser,totalVisitor:visitorCount[0].visitorCount})

        //generate session ID      
        // req.session.uuid = uuid4()
        // await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
        // const countUser = await db.allAsync('SELECT COUNT(uuid) as countUser FROM session') 
        // return res.status(200).json({visitorsCount:countUser[0].countUser})
        
        //calculate How many time user had requested
        // const visitorCount = await db.allAsync(`SELECT * FROM count`)
        // visitorCount[0].visitorCount += 1
        // await db.runAsync(`UPDATE count SET visitorCount = ${visitorCount[0].visitorCount}`)
        // const visitCount = await db.allAsync(`SELECT * FROM count`)
        // console.log(visitorCount[0].visitorCount);
       
        //when session is not exists we create a uuid and add that to our session and on database
        // if(!req.session.uuid){
        //     req.session.uuid = uuid4()
        //     await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
        //     const countUser = await db.allAsync('SELECT COUNT(uuid) as countUser FROM session') 
            
        //     return res.status(200).json({message:'Fetched Data Successfully.',totalUser:countUser[0].countUser,totalVisitor:visitorCount[0].visitorCount})
        // }
        // //when session was found on browser count will not increase 
        // else if(req.session.uuid){
        //     // req.session.uuid = uuid4()
        //     // await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
        //     // const countUser = await db.allAsync(`SELECT * FROM session WHERE uuid = '${req.session.uuid}'`) 
        //     const countUser = await db.allAsync(`SELECT COUNT(uuid) as countUser FROM session`) 
        //     return res.status(200).json({message:'Fetched Data Successfully.',totalUser:countUser[0].countUser,totalVisitor:visitorCount[0].visitorCount})
        // }
    } catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        res.status(err.status).json({message:'Internal Server Error'})
        next(err); 
    }
    db.close()
}


// exports.getSessionId = async function(req,res,next){
//     try {
//         // const cookies = req.body.cookie
//         // console.log(cookies);
//         //generate session ID      
//         // req.session.uuid = uuid4()
//         // await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
//         // const countUser = await db.allAsync('SELECT COUNT(uuid) as countUser FROM session') 
//         // return res.status(200).json({visitorsCount:countUser[0].countUser})
        
//         //calculate How many time user had requested
//         const visitorCount = await db.allAsync(`SELECT * FROM count`)
//         visitorCount[0].visitorCount += 1
//         await db.runAsync(`UPDATE count SET visitorCount = ${visitorCount[0].visitorCount}`)
//         // const visitCount = await db.allAsync(`SELECT * FROM count`)
//         // console.log(visitorCount[0].visitorCount);
       
//         //when session is not exists we create a uuid and add that to our session and on database
//         if(!req.session.uuid){
//             req.session.uuid = uuid4()
//             await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
//             const countUser = await db.allAsync('SELECT COUNT(uuid) as countUser FROM session') 
            
//             return res.status(200).json({message:'Fetched Data Successfully.',totalUser:countUser[0].countUser,totalVisitor:visitorCount[0].visitorCount})
//         }
//         //when session was found on browser count will not increase 
//         else if(req.session.uuid){
//             // req.session.uuid = uuid4()
//             // await db.runAsync(`INSERT INTO session(uuid) VALUES('${req.session.uuid}')`)
//             // const countUser = await db.allAsync(`SELECT * FROM session WHERE uuid = '${req.session.uuid}'`) 
//             const countUser = await db.allAsync(`SELECT COUNT(uuid) as countUser FROM session`) 
//             return res.status(200).json({message:'Fetched Data Successfully.',totalUser:countUser[0].countUser,totalVisitor:visitorCount[0].visitorCount})
//         }
//     } catch (err) {
//         if (!err.status) {
//             err.status = 500;
//         }
//         res.status(err.status).json({message:'Internal Server Error'})
//         next(err); 
//     }
//     db.close()
// }



exports.getLiveDemo = async function(req,res,next){
    try {
        //take endpointid and status from UI 
        const endpointId = req.params.endpointId
        const status = req.params.status

        const cookies = req.body.cookie
        console.log(cookies);

        // console.time();
        // http:/ calhost:3000/v1/api/users/demo/try/EP_c624aa54-83d6-4128-ad1e-f17e6c2d3e9a/11
        if(cookies){
            
            const start = (new Date).getTime();
            
            //fetch endpoint API
            const data = await axios.post(`https://be.flexahub.com/v1/operate/endpointid/${endpointId}/${status}`,{},{
                                        auth:{
                                            username: 'vinrap@gmail.com',
                                            password: 'Vin@7899'
                                        }
                        }) 

            //count Time duration for operating             
            const time = ((new Date).getTime() - start).toString().concat(' ms');  
                                
            if(data.status == 200){
                //count operation
                const count = await db.allAsync(`SELECT * FROM count`)
                count[0].opCount += 1
                await db.runAsync(`UPDATE count SET opCount = ${count[0].opCount}`)
                const opcount = await db.allAsync(`SELECT * FROM count`)
                return res.status(200).json({message:'Operate Successfully.',totalOperations:opcount[0].opCount,status:status,timeDuration:time})
            }else{
                return res.status(404).json({errorMessage:'Data Not Found Or Something went wrong!!'})
            }
        }
        else{
           return res.status(401).json({errorMessage:'May be Session Timeout Or Something Else'})
        }
       
    }catch (err) {
        if (!err.status) {
            err.status = 500;
        }
        res.status(err.status).json({message:'Internal Server Error'})
        next(err); 
    }
    db.close()
}





// exports.getLiveDemo = async function(req,res,next){
//     try {
//         //take endpointid and status from UI 
//         const endpointId = req.params.endpointId
//         const status = req.params.status
//         // console.time();
//         // http:/ calhost:3000/v1/api/users/demo/try/EP_c624aa54-83d6-4128-ad1e-f17e6c2d3e9a/11
//         if(req.session.uuid){
            
//             const start = (new Date).getTime();
            
//             //fetch endpoint API
//             const data = await axios.post(`https://be.flexahub.com/v1/operate/endpointid/${endpointId}/${status}`,{},{
//                                         auth:{
//                                             username: 'vinrap@gmail.com',
//                                             password: 'Vin@7899'
//                                         }
//                         }) 

//             //count Time duration for operating             
//             const time = ((new Date).getTime() - start).toString().concat(' ms');  
                                
//             if(data.status == 200){
//                 //count operation
//                 const count = await db.allAsync(`SELECT * FROM count`)
//                 count[0].opCount += 1
//                 await db.runAsync(`UPDATE count SET opCount = ${count[0].opCount}`)
//                 const opcount = await db.allAsync(`SELECT * FROM count`)
//                 return res.status(200).json({message:'Operate Successfully.',totalOperations:opcount[0].opCount,status:status,timeDuration:time})
//             }else{
//                 return res.status(404).json({errorMessage:'Data Not Found Or Something went wrong!!'})
//             }
//         }
//         else{
//            return res.status(401).json({errorMessage:'May be Session Timeout Or Something Else'})
//         }
       
//     }catch (err) {
//         if (!err.status) {
//             err.status = 500;
//         }
//         res.status(err.status).json({message:'Internal Server Error'})
//         next(err); 
//     }
//     db.close()
// }

