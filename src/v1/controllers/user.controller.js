

const Promise = require('bluebird');

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
		
                    WHERE  Node.masterId = '${masterID}' AND MQTTAliveResponse.timestamp BETWEEN datetime('now', '-2 days') AND datetime('now', 'localtime')
                    ORDER BY MQTTAliveResponse.timestamp desc`
        const data = await db.allAsync(sql1)

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
           
            let masterData = masterIds.map((d)=>({timestamp:d.timestamp}))
            
            let resetData = data1.map((d)=>({nodeResetTime:d.NodeResetTime}))
            const master = {
                  'masterId':data[i].masterId,
                  'nodeMacId':data[i].nodeMacId,
                  'timeStamp':masterData,
                  'NodeResetTime':resetData,
                  'resetCount': resetData.length     
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