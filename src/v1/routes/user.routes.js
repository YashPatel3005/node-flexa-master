
/**
 * User Routes
 */

const express = require('express')
const router = express.Router()

const UserController = require('../controllers/user.controller')


/**
 * @swagger
 * /v1/api/users:
 *  get:
 *    summary: Returns list of users
 *    tags:
 *       - name : User Information
 *    responses:
 *      '200':
 *          description: A Successfull Response
 *      '404':
 *          description: Not Found
 *      '500':
 *          description: Some Internal Errors
 */

router.get('/',UserController.getUsers)

/**
 * @swagger
 * /v1/api/users/nodes:
 *  post:
 *    summary: Returns all the user's Details of nodes that user have
 *    tags:
 *       - name : User Information
 *    produces:
 *       - application/json
 *    parameters:
 *       - name: body
 *         description: Object of multiple UserIds Array 
 *         in:  body
 *         required: true   
 *         schema:
 *            type: object
 *            required:
 *               - userId
 *            properties:              
 *               userId :
 *                 type: array
 *                 items: 
 *                     type: string           
 *    responses:
 *      '200':
 *          description: A Successfull Response
 *      '404':
 *          description: Not Found
 *      '500':
 *          description: Some Internal Errors
 */
router.post('/nodes',UserController.getUsersNodes)


router.post('/nodes/details',UserController.getNodesDetails)

module.exports = router