const { query } = require('../../db/index')

// 发送消息函数
const sendMessage = async (req, res) => {
    try {
        const { sender_type, sender_id, receiver_type, receiver_id, content, type } = req.body; // 假设请求体中包含发送者类型、发送者ID、接收者类型、接收者ID、内容和类型

        // 在数据库中插入消息数据
        const sql = 'INSERT INTO messages (sender_type, sender_id, receiver_type, receiver_id, content, type) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [sender_type, sender_id, receiver_type, receiver_id, content, type];

        const { result, fields } = await query(sql, values);
        console.log(result, fields);
        res.status(200).json({ code: 200, msg: '发送成功' });
    } catch (error) {
        console.error('Error inserting message: ', error);
        res.status(500).json({ code: 500, msg: '消息发送失败' });
    }
}

/**
 * 获取相关通知
 * @param {*} req 
 * @param {*} res 
 * @param {*} req.params.user_id 用户id
 */
const getNotification = async (req, res) => {
    try {
        const user_id = req.params.user_id; // 假设从查询参数中获取用户ID

        // 查询用户有关的所有消息，并包含发送者和接收者的基本信息， 如果是私信，就不是发送的还是接受的都要， 其他类型的只要接收的

        const sql = `
        SELECT 
            m.*,
            CASE
                WHEN m.type = 'private_message' THEN s.avatar_url
                ELSE r.avatar_url
            END AS sender_avatar,
            CASE
                WHEN m.type = 'private_message' THEN s.nickname
                ELSE r.nickname
            END AS sender_nickname,
            r.avatar_url AS receiver_avatar,
            r.nickname AS receiver_nickname
        FROM 
            messages m
        LEFT JOIN 
            users s ON m.sender_id = s.user_id
        LEFT JOIN 
            users r ON m.receiver_id = r.user_id
        WHERE 
            (m.type = 'private_message' AND (m.sender_id = ? OR m.receiver_id = ?))
            OR (m.type != 'private_message' AND m.receiver_id = ?)
        ORDER BY 
            m.created_at DESC`;
        const values = [user_id, user_id, user_id];
        const { result: notifyResult } = await query(sql, values);

        // 定义用于存储不同类型通知的对象
        const notifications = {
            messages: {
                send: [], // 发送给其他用户的私信
                received: [], // 接收到的其他用户的私信
            },
            admin_notifications: [], // 管理员通知
            interactive: {}, // 其他互动通知，如点赞、评论等
        };

        // 对查询结果进行分类处理
        notifyResult.forEach(notification => {
            if (notification.type === 'private_message') {
                if (notification.sender_id === 1 * user_id) {
                    // 发送给其他用户的私信
                    notifications.messages.send.push(notification);
                } else {
                    // 接收到的其他用户的私信
                    notifications.messages.received.push(notification);
                }
            } else if (notification.type === 'admin_notification') {
                // 管理员通知
                notifications.admin_notifications.push(notification);
            } else {
                // 其他互动通知
                if (!notifications.interactive[notification.type]) {
                    notifications.interactive[notification.type] = [];
                }
                notifications.interactive[notification.type].push(notification);
            }
        });

        res.status(200).json({ code: 200, msg: '获取成功', data: { notifications } });
    } catch (error) {
        console.error('Error retrieving notifications: ', error);
        res.status(500).json({ code: 500, msg: '获取通知失败' });
    }
};




/**
 * 获取两人之间消息记录函数，支持分页查询
 * @param {*} req 
 * @param {*} res 
 * 
 */
const getMessagesBetweenUsers = async (req, res) => {
    try {
        const { user1_id, user2_id, page = 1, limit = 10 } = req.body; // 从POST请求的body中获取用户1的ID、用户2的ID、页码和每页记录数

        // 计算偏移量
        const offset = (page - 1) * limit;

        // 查询两人之间的消息记录，按时间倒序排列，限制返回指定页的记录
        const sql = `
            SELECT content, sender_id, receiver_id,created_at
            FROM messages
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC
            LIMIT ?, ?`;
        const values = [user1_id, user2_id, user2_id, user1_id, offset, limit];

        const { result } = await query(sql, values);

        // 统计总数
        const sql2 = `
        SELECT COUNT(*) AS total_count
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`;
        const values1 = [user1_id, user2_id, user2_id, user1_id];

        const { result: countResult } = await query(sql2, values1);

        const totalCount = countResult[0].total_count;

        // 计算总页数
        const totalPages = Math.ceil(totalCount / limit);

        // 构造分页信息
        const pagination = {
            pageSize: limit,
            totalCount: totalCount,
            totalPages: totalPages,
            current_page: parseInt(page)
        };

        res.status(200).json({ code: 200, msg: '获取成功', data: { list:result, pagination } });
    } catch (error) {
        console.error('Error retrieving messages between users: ', error.message);
        res.status(500).json({ code: 500, msg: '获取消息记录失败' });
    }
}

// 导出函数以便在其他文件中使用
module.exports = { sendMessage, getNotification, getMessagesBetweenUsers };
