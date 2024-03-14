var express = require('express');
var router = express.Router();

/**,
 * @swagger
 * /user:
 *    get:
 *      tags:
 *      - H5前台应用调用接口
 *      summary: 测试
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
router.get('/user', function (req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
