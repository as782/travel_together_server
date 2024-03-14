const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { MY_JWT } = require('../config');
const router = express.Router();

// 注册接口
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    // 检测参数
    if (!username || !password) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }

    try {
        // 检查用户名是否已存在
        const userExists = await query('SELECT * FROM users WHERE username = ?', [username]);
        console.log(userExists);
        if (userExists.result.length > 0) {
            return res.status(400).json({ code: 400, msg: '用户名已存在' });
        }
        // 插入新用户
        const insertUserQuery = 'INSERT INTO users (username, password) VALUES (?, ?)';
        await query(insertUserQuery, [username, password]);
        res.status(200).json({ code: 200, msg: '注册成功' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }
});


// 登录接口
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(username, password);
    // 检测参数
    if (!username || !password) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }

    try {
        // 查询用户信息
        const { result } = await query('SELECT * FROM users WHERE username = ?', [username]);

        // 检查用户是否存在
        if (result.length === 0) {
            return res.status(404).json({ code: 404, msg: '用户不存在' });
        }

        // 验证密码
        if (password !== result[0].password) {
            return res.status(401).json({ code: 401, msg: '密码错误' });
        }

        // 生成 JWT Token
        const token = jwt.sign({ id: result[0].id, username: result[0].username }, MY_JWT.SECRET_KEY, { expiresIn: MY_JWT.TIMEOUT });

        const { user_id, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = result[0];
        const user_info = {
            user_id,
            username: result[0].username,
            avatar_url,
            nickname,
            gender,
            bio,
            birthday,
            address: {
                name: region_name,
                code: region_code
            },
            contact: {
                phone: contact_phone,
                email: contact_email
            },
            created_at
        }

        // 返回登录成功的消息和 token
        res.status(200).json({
            code: 200,
            msg: '登录成功',
            token: token,
            data: {
                user_info
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ code: 500, msg: '服务器错误' });
    }

});




module.exports = router;
