const { query } = require("../../db/index");
const { DYNAMIC_POST_COMMENTS, TEAM_ACTIVITY_POST_COMMENTS, DYNAMIC_POSTS, USERS, TEAM_ACTIVITY_POSTS } = require("../../db/config");
const isExistINTable = require("../utils/isExistUserAndPost");
/**
 * 发表评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 帖子 ID
 * @param {string} req.body.content 评论内容
 * @param {string} tableName 数据库表名
 */
const postComment = async (req, res, tableName) => {
    const { user_id, post_id, content } = req.body;
    const id_key = tableName === DYNAMIC_POST_COMMENTS ? 'dynamic_post_id' : 'post_id';
    try {
        // 插入评论记录到数据库
        const insertCommentSql = `INSERT INTO ${tableName} (user_id, ${id_key}, content) VALUES (?, ?, ?)`;
        await query(insertCommentSql, [user_id, post_id, content]);

        res.status(200).json({ code: 200, msg: '评论发表成功' });
    } catch (error) {
        console.error(`发表评论失败:`, error);
        res.status(500).json({ code: 500, msg: '发表评论失败' });
    }
}

/**
 * 删除评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.comment_id 评论 ID
 * @param {number} req.body.user_id 用户 ID
 * @param {string} tableName 数据库表名
 */
const deleteComment = async (req, res, tableName) => {
    const { comment_id, user_id } = req.body;

    try {
        // 检查评论是否存在且是否属于当前用户
        const commentCheckSql = `SELECT * FROM ${tableName} WHERE comment_id = ? AND user_id = ?`;
        const { result: existingComment } = await query(commentCheckSql, [comment_id, user_id]);

        if (existingComment.length === 0) {
            return res.status(403).json({ code: 403, msg: '评论不存在或您无权删除该评论' });
        }

        // 删除评论
        const deleteCommentSql = `DELETE FROM ${tableName} WHERE comment_id = ?`;
        await query(deleteCommentSql, [comment_id]);

        res.status(200).json({ code: 200, msg: '评论删除成功' });
    } catch (error) {
        console.error(`删除评论失败:`, error);
        res.status(500).json({ code: 500, msg: '删除评论失败' });
    }
}


/**
 * 发表动态帖子评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 动态帖子 ID
 * @param {string} req.body.content 评论内容
 */
const postDynamicPostComment = async (req, res) => {
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
    await postComment(req, res, DYNAMIC_POST_COMMENTS);
}

/**
 * 发表组队帖子评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 组队帖子 ID
 * @param {string} req.body.content 评论内容
 */
const postTeamPostComment = async (req, res) => {
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
        return res.status(400).json({ code: 400, msg: '帖子不存在' });
    }
    await postComment(req, res, TEAM_ACTIVITY_POST_COMMENTS);
}

/**
 * 删除动态帖子评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.comment_id 评论 ID
 * @param {number} req.body.user_id 用户 ID
 */
const deleteDynamicPostComment = async (req, res) => {
    await deleteComment(req, res, DYNAMIC_POST_COMMENTS);
}

/**
 * 删除组队帖子评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.comment_id 评论 ID
 * @param {number} req.body.user_id 用户 ID
 */
const deleteTeamPostComment = async (req, res) => {
    await deleteComment(req, res, TEAM_ACTIVITY_POST_COMMENTS);
}

// -------------------------管理员使用API------------------------------------//

/**
 * 查询帖子的评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.params.post_id 帖子 ID
 */
const getPostComments = async (req, res) => {
    const { post_id } = req.params;

    try {
        const sql = `SELECT * FROM ${DYNAMIC_POST_COMMENTS} WHERE dynamic_post_id = ?`;
        const { result: comments } = await query(sql, [post_id]);

        res.status(200).json({ code: 200, msg: '查询帖子评论成功', data: comments });
    } catch (error) {
        console.error('查询帖子评论失败:', error);
        res.status(500).json({ code: 500, msg: '查询帖子评论失败' });
    }
}

/**
 * 查询用户的评论
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.params.user_id 用户 ID
 */
const getUserComments = async (req, res) => {
    const { user_id } = req.params;

    try {
        const sql = `SELECT * FROM ${DYNAMIC_POST_COMMENTS} WHERE user_id = ?`;
        const { result: comments } = await query(sql, [user_id]);

        res.status(200).json({ code: 200, msg: '查询用户评论成功', data: comments });
    } catch (error) {
        console.error('查询用户评论失败:', error);
        res.status(500).json({ code: 500, msg: '查询用户评论失败' });
    }
}

module.exports = {
    getPostComments,
    getUserComments,
    postDynamicPostComment,
    postTeamPostComment,
    deleteDynamicPostComment,
    deleteTeamPostComment
}