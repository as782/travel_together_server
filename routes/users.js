var express = require('express');
const { query } = require('../db');
const { getUserInfo, getFollowers, getFans, updateUserInfo, joinTeam } = require('../control/user');
var router = express.Router();


/**
 * @swagger
 * /users/getUserInfo/{id}:
 *   get:
 *     summary: 通过用户ID获取用户信息
 *     description: 根据用户ID获取用户的详细信息，包括基本信息、关联的标签等。
 *     tags:
 *       - 用户操作
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       '200':
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: ''
 *       '400':
 *         description: 参数错误
 *       '500':
 *         description: 服务器错误
 */
router.get('/getUserInfo/:id',getUserInfo);

// 获取关注用户列表
router.get('/follows/:user_id',getFollowers)

// 获取粉丝用户列表
router.get('/fans/:user_id',getFans)


// 更新用户信息
router.post('/update', updateUserInfo)


// 加入小队
router.post('/joinTeam/', joinTeam)


module.exports = router;
