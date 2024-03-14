var express = require('express');
var router = express.Router();

/**,
 * @swagger
 * /:
 *    get:
 *      tags:
 *      -  express 首页
 *      summary: 首页
 *      produces:
 *      - application/json
 *      responses:
 *        200:
 *          description: successful operation
 *          schema:
 *            ref: #/definitions/Order
 *        400:
 *          description: Invalid ID supplied
 *        404:
 *          description: Order not found
 * */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});



module.exports = router;