var express = require('express');
const { query } = require('../db');
var router = express.Router();

/**,
 * @swagger
 * /user/getUserInfo/{id}:
 *    get:
 *      tags:
 *      - H5前台应用调用接口
 *      summary: 获取用户信息
 *      produces:
 *      - application/json
 *      parameters:
 *      - name: id
 *        in: path
 *        description: 用户ID
 *        required: true
 *        schema:
 *          type: integer
 *      responses:
 *        200:
 *          description: successful operation
 *          schema:
 *            type: object
 *            properties:
 *              code:
 *                type: integer
 *              msg:
 *                type: string
 *              data:
 *                $ref: '#/definitions/User'
 *        400:
 *          description: Invalid ID supplied
 *        404:
 *          description: User not found
 * */

router.get('/getUserInfo/:id', function (req, res, next) {
  let userId = req.params.id;
  let sql = `SELECT * FROM users WHERE id = ${userId}`;
  query(sql, (err, result) => {
    if (err) {
      console.error('Error querying database:', err);
      let data = {
        code: 500,
        msg: 'Internal server error',
        data: null
      };
      res.status(500).json(data);
    } else {
      if (result.length === 0) {
        let data = {
          code: 404,
          msg: 'User not found',
          data: null
        };
        res.status(404).json(data);
      } else {
        let data = {
          code: 200,
          msg: 'Success',
          data: result[0]
        };
        res.status(200).json(data);
      }
    }
  });
});

module.exports = router;
