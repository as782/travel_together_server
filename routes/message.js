const express = require('express');
const { sendMessage, getNotification, getMessagesBetweenUsers } = require('../control/message/index,');
const router = express.Router();

// 发送消息
router.post('/sendMessage', sendMessage);

// 拉取通知
router.get('/getNotification/:user_id', getNotification);

// 获取两人之间的记录
router.post('/getMessagesBetweenUsers', getMessagesBetweenUsers);
module.exports = router;