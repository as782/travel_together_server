const { query } = require("../../db/index");
const { DYNAMIC_POST_LIKES, TEAM_ACTIVITY_POST_LIKES, TEAM_ACTIVITY_POSTS, USERS, DYNAMIC_POSTS } = require("../../db/config");
const isExistINTable = require("../utils/isExistUserAndPost");

/**
 * 点赞或取消点赞帖子
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 帖子 ID
 * @param {string} tableName 数据库表名
 */
const toggleLikePost = async (req, res, tableName) => {
    const { user_id, post_id } = req.body;
    const id_key = tableName === DYNAMIC_POST_LIKES ? 'dynamic_post_id' : 'post_id';
    try {
        // 检查用户是否已经点赞过该帖子
        const likeCheckSql = `SELECT * FROM ${tableName} WHERE user_id = ? AND ${id_key} = ?`;
        const { result: existingLike } = await query(likeCheckSql, [user_id, post_id]);

        if (existingLike.length > 0) {
            // 如果存在点赞记录，则执行取消点赞操作
            const deleteLikeSql = `DELETE FROM ${tableName} WHERE user_id = ? AND ${id_key} = ?`;
            await query(deleteLikeSql, [user_id, post_id]);

            res.status(200).json({ code: 200, msg: '取消点赞成功' });
        } else {
            // 如果不存在点赞记录，则执行点赞操作
            const insertLikeSql = `INSERT INTO ${tableName} (user_id, ${id_key}) VALUES (?, ?)`;
            await query(insertLikeSql, [user_id, post_id]);

            res.status(200).json({ code: 200, msg: '点赞成功' });
        }
    } catch (error) {
        console.error(`操作帖子失败:`, error);
        res.status(500).json({ code: 500, msg: '操作帖子失败' });
    }
}

/**
 * 点赞或取消点赞动态帖子
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 动态帖子 ID
 */
const toggleLikeDynamicPost = async (req, res) => {
    const { user_id, post_id } = req.body;
    // 检查用户和帖子是否存在
    const [userResult, postResult] = await Promise.all([
        isExistINTable(USERS, { user_id }),
        isExistINTable(DYNAMIC_POSTS, { dynamic_post_id: post_id })
    ]);

    if (!userResult) {
        return res.status(400).json({ code: 400, msg: '用户不存在' });
    }

    if (!postResult) {
        return res.status(400).json({ code: 400, msg: '点赞帖子不存在' });
    }
    await toggleLikePost(req, res, DYNAMIC_POST_LIKES);
}

/**
 * 点赞或取消点赞组队帖子
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 组队帖子 ID
 */
const toggleLikeTeamPost = async (req, res) => {
    const { user_id, post_id } = req.body;
    // 检查用户和帖子是否存在
    const [userResult, postResult] = await Promise.all([
        isExistINTable(USERS, { user_id }),
        isExistINTable(TEAM_ACTIVITY_POSTS, { post_id })
    ]);

    if (!userResult) {
        return res.status(400).json({ code: 400, msg: '用户不存在' });
    }

    if (!postResult) {
        return res.status(400).json({ code: 400, msg: '点赞帖子不存在' });
    }
    await toggleLikePost(req, res, TEAM_ACTIVITY_POST_LIKES);
}


/**
 * 获取点赞帖子的用户列表
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.params.post_id 帖子 ID
 * @param {string} tableName 数据库表名
 */
const getLikedUsers = async (req, res, tableName) => {
    const { post_id } = req.params;
    const id_key = tableName === DYNAMIC_POST_LIKES ? 'dynamic_post_id' : 'post_id';
    try {
        const sql = `SELECT user_id FROM ${tableName} WHERE ${id_key} = ?`;
        const { result: likedUsers } = await query(sql, [post_id]);
        res.status(200).json({ code: 200, msg: '获取成功', data: likedUsers });
    } catch (error) {
        console.error(`获取点赞帖子的用户列表失败:`, error);
        res.status(500).json({ code: 500, msg: '获取点赞帖子的用户列表失败' });
    }
}

/**
 * 获取点赞动态帖子的用户列表
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.params.post_id 动态帖子 ID
 */
const getLikedDynamicPostUsers = async (req, res) => {
    await getLikedUsers(req, res, DYNAMIC_POST_LIKES);
}

/**
 * 获取点赞组队帖子的用户列表
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.params.post_id 组队帖子 ID
 */
const getLikedTeamPostUsers = async (req, res) => {
    await getLikedUsers(req, res, TEAM_ACTIVITY_POST_LIKES);
}


// 管理员使用

/**
 * 查询用户点赞的帖子
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.query.user_id 用户 ID
 */
const getUserLikedDynamicPosts = async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = `SELECT * FROM ${DYNAMIC_POST_LIKES} WHERE user_id = ?`;
        const { result: likedPosts } = await query(sql, [user_id]);

        res.status(200).json({ code: 200, msg: '查询用户点赞的帖子成功', data: likedPosts });
    } catch (error) {
        console.error('查询用户点赞的帖子失败:', error);
        res.status(500).json({ code: 500, msg: '查询用户点赞的帖子失败' });
    }
}

module.exports = {
    toggleLikeDynamicPost,
    toggleLikeTeamPost,
    getUserLikedDynamicPosts,
    getLikedDynamicPostUsers,
    getLikedTeamPostUsers
}