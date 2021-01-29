const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
    swaggerDefinition:{
        info:{
            title:'Admin API',
            version:1.0,
            description:"Admin API information",
            servers:["http://localhost:3000"],
            basePath: '/',
        }
    },
    apis:["./src/v1/routes/**/**.js"],
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

module.exports = swaggerDocs