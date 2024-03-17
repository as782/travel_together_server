const express = require('express');
const { sendMessage, getNotification } = require('../control/message/index,');
const router = express.Router();

// 发送消息
router.post('/sendMessage', sendMessage);

// 拉取通知
router.get('/getNotification', getNotification);
module.exports = router;