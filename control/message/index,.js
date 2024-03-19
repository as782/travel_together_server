const { MESSAGES, USERS } = require('../../db/config');
const { query } = require('../../db/index')

/**
 * 发送消息函数
 * @param {*} req 请求对象，包含消息发送者和接收者信息以及消息内容和类型
 * @param {*} res 响应对象，用于向客户端发送响应结果
 * @param {string} req.body.sender_type 发送者类型，可以是'user'或'admin'
 * @param {number} req.body.sender_id 发送者ID
 * @param {string} req.body.receiver_type 接收者类型，可以是'user'或'admin'
 * @param {number} req.body.receiver_id 接收者ID
 * @param {string} req.body.content 消息内容
 * @param {string} req.body.type 消息类型，可以是'private_message', 'dynamic_post_comment', 'dynamic_post_like', 'team_activity_post_comment', 'team_activity_post_like', 'admin_notification', 'follow_notification'
 */
const sendMessage = async (req, res) => {
    try {
        const { sender_type, sender_id, receiver_type, receiver_id, content, type } = req.body; // 假设请求体中包含发送者类型、发送者ID、接收者类型、接收者ID、内容和类型

        // 在数据库中插入消息数据
        const sql = `INSERT INTO ${MESSAGES} (sender_type, sender_id, receiver_type, receiver_id, content, type) VALUES (?, ?, ?, ?, ?, ?)`;
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
            ${MESSAGES} m
        LEFT JOIN 
            ${USERS} s ON m.sender_id = s.user_id
        LEFT JOIN 
            ${USERS} r ON m.receiver_id = r.user_id
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
 * @param {*} req 请求对象，包含用户1和用户2的ID以及分页信息
 * @param {*} res 响应对象，用于向客户端发送响应结果
 * @param {number} req.body.user1_id 用户1的ID
 * @param {number} req.body.user2_id 用户2的ID
 * @param {number} req.body.page 页码，默认为1
 * @param {number} req.body.limit 每页记录数，默认为10
 */
const getMessagesBetweenUsers = async (req, res) => {
    try {
        const { user1_id, user2_id, page = 1, limit = 10 } = req.body; // 从POST请求的body中获取用户1的ID、用户2的ID、页码和每页记录数

        // 计算偏移量
        const offset = (page - 1) * limit;

        // 查询两人之间的消息记录，按时间倒序排列，限制返回指定页的记录
        const sql = `
            SELECT content, sender_id, receiver_id,created_at
            FROM ${MESSAGES}
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
            ORDER BY created_at DESC
            LIMIT ?, ?`;
        const values = [user1_id, user2_id, user2_id, user1_id, offset, limit];

        const { result } = await query(sql, values);

        // 统计总数
        const sql2 = `
        SELECT COUNT(*) AS total_count
        FROM ${MESSAGES}
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

        res.status(200).json({ code: 200, msg: '获取成功', data: { list: result, pagination } });
    } catch (error) {
        console.error('Error retrieving messages between users: ', error.message);
        res.status(500).json({ code: 500, msg: '获取消息记录失败' });
    }
}


/**
 * 获取用户所有的管理员通知函数，支持分页查询
 * @param {*} req 请求对象，包含用户ID以及分页信息
 * @param {*} res 响应对象，用于向客户端发送响应结果
 * @param {number} req.body.user_id 用户ID
 * @param {number} req.body.page 页码，默认为1
 * @param {number} req.body.limit 每页记录数，默认为10
 */
const getUserAdminNotifications = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10 } = req.body; // 从POST请求的body中获取用户ID、页码和每页记录数

        // 查询总数
        const totalAdminNotificationsSql = `SELECT COUNT(*) AS total FROM ${MESSAGES} WHERE receiver_id = ? AND type = "admin_notification"`;
        const totalAdminNotificationsValues = [user_id];
        const { result: totalAdminNotificationsResult } = await query(totalAdminNotificationsSql, totalAdminNotificationsValues);
        const totalAdminNotifications = totalAdminNotificationsResult[0].total;

        // 计算总页数
        const totalPages = Math.ceil(totalAdminNotifications / limit);

        // 计算偏移量
        const offset = (page - 1) * limit;

        // 查询用户的管理员通知，按时间倒序排列，限制返回指定页的记录
        const sql = `
            SELECT *
            FROM ${MESSAGES}
            WHERE receiver_id = ? AND type = 'admin_notification'
            ORDER BY created_at DESC
            LIMIT ?, ?`;
        const values = [user_id, offset, limit];

        const { result } = await query(sql, values);

        // 构造分页信息
        const pagination = {
            pageSize: limit,
            totalCount: totalAdminNotifications,
            totalPages: totalPages,
            current_page: parseInt(page)
        };

        res.status(200).json({ code: 200, msg: '获取管理员通知成功', adminNotifications: result, pagination });
    } catch (error) {
        console.error('Error retrieving user admin notifications: ', error);
        res.status(500).json({ code: 500, msg: '获取管理员通知失败' });
    }
}

/**
 * 获取用户的互动通知函数，支持分页查询
 * @param {*} req 请求对象，包含用户ID以及分页信息
 * @param {*} res 响应对象，用于向客户端发送响应结果
 * @param {number} req.body.user_id 用户ID
 * @param {number} req.body.page 页码，默认为1  
 * @param {number} req.body.limit 每页记录数，默认为10
 */
const getUserInteractiveNotifications = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10 } = req.body; // 从POST请求的body中获取用户ID、页码和每页记录数

        // 查询总数
        const totalInteractiveNotificationsSql = `SELECT COUNT(*) AS total FROM ${MESSAGES} WHERE receiver_id = ? AND type != "admin_notification"  AND type !="private_message"`;
        const totalInteractiveNotificationsValues = [user_id];
        const { result: totalInteractiveNotificationsResult } = await query(totalInteractiveNotificationsSql, totalInteractiveNotificationsValues);
        const totalInteractiveNotifications = totalInteractiveNotificationsResult[0].total;

        // 计算总页数
        const totalPages = Math.ceil(totalInteractiveNotifications / limit);

        // 计算偏移量
        const offset = (page - 1) * limit;

        // 查询用户的互动通知，按时间倒序排列，限制返回指定页的记录
        const sql = `
            SELECT *
            FROM ${MESSAGES}
            WHERE receiver_id = ? AND type != 'admin_notification' AND type !="private_message"
            ORDER BY created_at DESC
            LIMIT ?, ?`;
        const values = [user_id, offset, limit];

        const { result } = await query(sql, values);

        // 构造分页信息
        const pagination = {
            pageSize: limit,
            totalCount: totalInteractiveNotifications,
            totalPages: totalPages,
            current_page: parseInt(page)
        };

        res.status(200).json({ code: 200, msg: '获取互动通知成功', interactiveNotifications: result, pagination });
    } catch (error) {
        console.error('Error retrieving user interactive notifications: ', error);
        res.status(500).json({ code: 500, msg: '获取互动通知失败' });
    }
}



// 导出函数以便在其他文件中使用
module.exports = {
    sendMessage, getNotification, getMessagesBetweenUsers,
    getUserAdminNotifications, getUserInteractiveNotifications
};
