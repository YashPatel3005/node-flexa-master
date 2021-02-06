var moment = require('moment'); // require
moment().format(); 
const timeStamp = [
    "2021-02-02 17:29:11.897962",
    "2021-02-02 17:23:05.524069",
    "2021-02-02 17:23:00.324544",
    "2021-02-02 17:22:57.251637",
    "2021-02-02 17:22:57.101746",
    "2021-02-02 17:22:55.943545",
    "2021-02-02 17:22:52.990822",
    "2021-02-02 17:22:51.360083",//only show min in timestamp wheen fetch api inn angular
    "2021-02-02 17:22:49.991879",
    "2021-02-02 17:22:41.854961",
    "2021-02-02 17:22:39.381669",
    "2021-02-02 17:22:35.487071",
    "2021-02-02 17:22:30.301704",
    "2021-02-02 17:22:27.185651",
    "2021-02-02 17:22:27.070903",
    "2021-02-02 17:22:25.864894",
    "2021-02-02 17:22:22.855966",
    "2021-02-02 17:22:21.019228",
    "2021-02-02 17:22:19.884416",
    "2021-02-02 17:22:11.870676",
    "2021-02-02 17:22:09.408798",
    "2021-02-02 17:22:05.436102",
    "2021-02-02 17:21:59.251993",
    "2021-02-02 17:19:57.125921"
]
let allDate = []
for(let i=0;i<timeStamp.length;i++){
    let d = timeStamp[i].slice(0,timeStamp[i].lastIndexOf(":"))
    allDate.push(d)
}


 let unique = [...new Set(allDate)]
 console.log(unique);

let status = []
for(let i=0;i<unique.length;i++){
    if(i == 0){
        status.push('1')
    }
    else{
        let currDate = moment(unique[i]).valueOf()
        let prevDate = moment(unique[i-1]).valueOf()
        if(( prevDate - currDate ) < 90000){
            status.push('1')
          
        }
        else{    
            status.push('0')
           
        }
    }
}
console.log(status);

// initialize session
// call ashish api for control- operating specific point
// increase counter
// counter in ashish api ..how many  time on-off  