const { query } = require('../../db/index')

// 发送消息函数
const sendMessage = async (req, res) => {
    try {
        const { sender_type, sender_id, receiver_type, receiver_id, content, type } = req.body; // 假设请求体中包含发送者类型、发送者ID、接收者类型、接收者ID、内容和类型

        // 在数据库中插入消息数据
        const query = 'INSERT INTO messages (sender_type, sender_id, receiver_type, receiver_id, content, type) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [sender_type, sender_id, receiver_type, receiver_id, content, type];

        const { result, fields } = await query(query, values);
        console.log(result, fields);
        res.status(200).json({ code: 200, msg: '发送成功' });
    } catch (error) {
        console.error('Error inserting message: ', error);
        res.status(500).json({ code: 500, msg: '消息发送失败' });
    }
}

// 获取通知函数
const getNotification = async (req, res) => {
    try {
        const user_id = req.query.user_id; // 假设从查询参数中获取用户ID

        // 查询用户接收到的所有消息
        const query = 'SELECT * FROM messages WHERE receiver_id = ? ORDER BY created_at DESC';
        const values = [user_id];

        const { result, fields } = await query(query, values);
        console.log(result, fields);
        res.status(200).json({ code: 200, msg: '获取成功', notifications: result });
    } catch (error) {
        console.error('Error retrieving notifications: ', error);
        res.status(500).json({ code: 500, msg: '获取通知失败' });
    }
}



// 获取两人之间消息记录函数，支持分页查询
const getMessagesBetweenUsers = async (req, res) => {
    try {
        const { user1_id, user2_id, page = 1, pageSize = 10 } = req.body; // 从POST请求的body中获取用户1的ID、用户2的ID、页码和每页记录数

        // 计算偏移量
        const offset = (page - 1) * pageSize;

        // 查询两人之间的消息记录，按时间倒序排列，限制返回指定页的记录
        const query = `
            SELECT *
            FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC
            LIMIT ?, ?`;
        const values = [user1_id, user2_id, user2_id, user1_id, offset, pageSize];

        const { result, fields } = await query(query, values);
        console.log(result, fields);
        res.status(200).json({ code: 200, msg: '获取成功', messages: result });
    } catch (error) {
        console.error('Error retrieving messages between users: ', error);
        res.status(500).json({ code: 500, msg: '获取消息记录失败' });
    }
}

// 导出函数以便在其他文件中使用
module.exports = { sendMessage, getNotification, getMessagesBetweenUsers };
