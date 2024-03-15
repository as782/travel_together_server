const { query } = require('../../db/index');
const getUserTagsInfo = require('../utils/getUserTags');
const { insertDataToDatabase, associateImagesWithData } = require('./postRelativeImage');
/**
 * 发布动态帖子
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const publishDynamicPost = async (req, res) => {
    try {
        const {
            user_id,
            content,
            image_urls
        } = req.body;
        // 检查必要字段是否存在
        if (!user_id) {
            return res.status(400).json({ code: 400, msg: '缺少必要字段' });
        }
        // 查询用户存在
        const { result: userResult } = await query(`SELECT * FROM users WHERE user_id = ?`, [user_id]);
        if (userResult.length === 0) {
            return res.status(400).json({ code: 400, msg: '用户不存在' });
        }


        // 插入到数据库，返回post id
        const postId = await insertDataToDatabase('dynamic_posts', {
            user_id,
            content
        });
        // 通过 关联图片和帖子
        await associateImagesWithData('dynamic_post_images', postId, image_urls, ['dynamic_post_id', 'image_url'])

        res.status(200).json({ code: 200, msg: '发布动态成功' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }
};

/**
 * 更新动态帖子
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @returns {Promise<void>}
 */
const updateDynamicPost = async (req, res) => {
    try {
        // 解构请求体
        const { user_id, dynamic_post_id, content, image_urls } = req.body;

        // 检查必要字段是否存在
        if (!user_id || !dynamic_post_id) {
            return res.status(400).json({ code: 400, msg: '缺少必要字段' });
        }

        // 更新动态帖子信息到数据库
        const tableName = 'dynamic_posts';
        const updateFields = [];
        const values = [];

        // 构建需要更新的字段和对应的值
        if (content) {
            updateFields.push('content = ?');
            values.push(content);
        }

        // 执行更新操作
        if (updateFields.length > 0) {
            const sql = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE dynamic_post_id = ? AND user_id = ?`;
            values.push(dynamic_post_id, user_id);
            await query(sql, values);
        }

        // 更新动态帖子的图片
        if (image_urls && image_urls.length > 0) {
            await associateImagesWithData('dynamic_post_images', dynamic_post_id, image_urls, ['dynamic_post_id', 'image_url']);
        }

        // 返回成功消息
        res.status(200).json({ code: 200, msg: '更新动态帖子成功' });
    } catch (error) {
        // 捕获并返回错误信息
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }
};


/**
 * 发布组队帖子
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const publishTeamPost = async (req, res) => {
    try {
        const {
            user_id,
            title,
            description,
            start_location,
            end_location,
            duration_day,
            team_size,
            estimated_expense,
            gender_requirement,
            payment_method,
            theme_id,
            itinerary,
            image_urls
        } = req.body;

        // 查询用户存在
        const { result: userResult } = await query(`SELECT * FROM users WHERE user_id = ?`, [user_id]);
        if (userResult.length === 0) {
            return res.status(400).json({ code: 400, msg: '用户不存在' });
        }


        // 检查必要字段是否存在
        if (!user_id || !title || !start_location || !end_location || !duration_day || !team_size || !payment_method || !theme_id || !image_urls.length) {
            return res.status(400).json({ code: 400, msg: '缺少必要字段' });
        }

        // 插入到数据库，返回post id
        const postId = await insertDataToDatabase('team_activity_posts', {
            user_id,
            title,
            description,
            start_location,
            end_location,
            duration_day,
            team_size,
            estimated_expense,
            gender_requirement,
            payment_method,
            theme_id,
        });
        // 通过 关联图片和帖子
        await associateImagesWithData('team_activity_images', postId, image_urls, ['post_id', 'image_url'])

        // 行程
        if (itinerary) {
            await associateImagesWithData('itineraries', postId, [itinerary], ['post_id', 'image_url'])
        }
        res.status(200).json({ code: 200, msg: '发布组队帖子成功' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }
};

/**
 * 更新组队帖子
 * @param {Request} req - Express请求对象
 * @param {Response} res - Express响应对象
 * @returns {Promise<void>}
 */
const updateTeamPost = async (req, res) => {
    try {
        const {
            post_id,
            user_id,
            itinerary,
            image_urls
        } = req.body;
        if (!post_id || !user_id) {
            return res.status(400).json({ code: 400, msg: '缺少必要字段' });
        }

        // 检查帖子是否存在及权限
        const { result: postResult } = await query(`SELECT * FROM team_activity_posts WHERE post_id = ? AND user_id = ?`, [post_id, user_id]);
        if (!postResult.length) {
            return res.status(400).json({ code: 400, msg: '帖子不存在或无权限' });
        }

        // 准备更新字段和值
        const updateFields = [];
        const values = [];

        const updateMap = {
            title: 'title = ?',
            description: 'description = ?',
            start_location: 'start_location = ?',
            end_location: 'end_location = ?',
            duration_day: 'duration_day = ?',
            team_size: 'team_size = ?',
            estimated_expense: 'estimated_expense = ?',
            gender_requirement: 'gender_requirement = ?',
            payment_method: 'payment_method = ?',
            theme_id: 'theme_id = ?'
        };

        Object.entries(updateMap).forEach(([key, value]) => {
            if (req.body[key]) {
                updateFields.push(value);
                values.push(req.body[key]);
            }
        });

        if (!updateFields.length) {
            return res.status(400).json({ code: 400, msg: '未提供要更新的字段' });
        }

        // 构建更新语句
        const tableName = 'team_activity_posts';
        const sql = `UPDATE ${tableName} SET ${updateFields.join(', ')} WHERE post_id = ?`;
        values.push(post_id);

        // 执行更新
        await query(sql, values);

        // 更新图片和行程
        if (image_urls && image_urls.length) {
            await associateImagesWithData('team_activity_images', post_id, image_urls, ['post_id', 'image_url']);
        }
        if (itinerary) {
            await associateImagesWithData('itineraries', post_id, [itinerary], ['post_id', 'image_url']);
        }

        res.status(200).json({ code: 200, msg: '更新组队帖子成功' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }

};

/**
 * 获取用户信息
 * @param {*} user_id 
 * @returns 
 */
async function getUserInfo(user_id) {
    const USERS = 'users';
    // 获取用户信息
    const sql = `SELECT * FROM ${USERS} WHERE user_id = ?`;
    const { result: userResult } = await query(sql, [user_id]);

    return userResult[0];
}

/**
 * // 查询动态
 * @param {*} req 
 * @param {*} res 
 * @returns 
 */
const getDynamicPost = async (req, res) => {
    const { dynamic_post_id } = req.params;
    // table name 

    const DYNAMIC_POSTS = 'dynamic_posts';
    const DYNAMIC_POST_COMMENTS = "dynamic_post_comments";
    const DYNAMIC_POST_IMGAES = "dynamic_post_images";
    const DYNAMIC_POST_LIKES = "dynamic_post_likes";
    try {
        const sql = `SELECT * FROM ${DYNAMIC_POSTS} WHERE dynamic_post_id = ?`;
        const { result: postResult } = await query(sql, [dynamic_post_id]);
        const post = postResult[0];

        if (!post) {
            return res.status(404).json({ code: 404, msg: '帖子不存在' });
        }

        // 动态信息
        const { content, user_id, created_at } = post;

        // 用户信息
        const { nickname, avatar_url } = await getUserInfo(user_id);

        // 获取tags
        const userTagsinfo = await getUserTagsInfo([user_id]);
        const tags = userTagsinfo.find(e => {
            return e.user_id === user_id;
        }).tags;

        // 用户信息
        const user_info = {
            avatar: avatar_url,
            nickname,
            tags
        }

        // 图片
        const sql3 = `SELECT * FROM ${DYNAMIC_POST_IMGAES} WHERE dynamic_post_id = ?`;
        const { result: imageResult } = await query(sql3, [dynamic_post_id]);
        let images = []
        if (imageResult.length > 0) {
            images = imageResult.map(e => {
                return { image_id: e.image_id, image_url: e.image_url };
            }); // {image_id, image_url}
        }

        // 评论
        const sql4 = `SELECT * FROM ${DYNAMIC_POST_COMMENTS} WHERE post_id = ?`;
        const { result: commentResult } = await query(sql4, [dynamic_post_id]);
        // [{comment_id, user_id, content, created_at}...]

        let comments = [];
        if (commentResult.length > 0) {
            comments = Promise.all(commentResult.map(async (cmoment) => {
                const { nickname, avatar_url } = await getUserInfo(content.user_id);
                return {
                    ...cmoment,
                    user_info: {
                        user_id: cmoment.user_id,
                        nickname,
                        avatar: avatar_url
                    }
                };
            }))
        }

        // like userids
        const sql5 = `SELECT * FROM ${DYNAMIC_POST_LIKES} WHERE post_id = ?`;
        const { result: likeResult } = await query(sql5, [dynamic_post_id]);
        const like_userIds = likeResult.map(e => e.user_id);

        res.status(200).json({
            code: 200, msg: '查询帖子成功', data: {
                post: {
                    dynamic_post_id,
                    content,
                    images,
                    created_at,
                    user_info,
                    comments,
                    like_userIds
                }
            }
        });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '查询失败' + error.message });
        throw error;
    }
}


/**
 * 查组队帖子
 * @param {*} req 
 * @param {*} res 
 */
const getTeamPost = async (req, res) => {
    const { post_id } = req.params;

    if (!post_id) {
        res.status(400).json({ code: 400, msg: '参数错误' });
    }
    // 查询组队帖子的信息
    const TEAM_POSTS = 'team_activity_posts';
    const TEAM_POST_IMAGES = 'team_activity_images';
    const TEAM_POST_COMMENTS = 'team_activity_post_comments';
    const TEAM_POST_LIKES = 'team_activity_post_likes';
    const ITINERARIES = 'itineraries';
    // const TEAM_THEME = 'team_activity_themes';

    const sql = `SELECT * FROM ${TEAM_POSTS} WHERE  post_id = ?`;
    const { result: postResult } = await query(sql, [post_id]);
    const post = postResult[0];

    if (!post) {
        return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    // 动态信息
    const {
        user_id,
        title,
        description,
        start_location,
        end_location,
        duration_day,
        team_size,
        estimated_expense,
        gender_requirement,
        payment_method,
        theme_id,
        created_at
    } = post;

    // 用户信息
    const { nickname, avatar_url } = await getUserInfo(user_id);

    // 获取tags
    const userTagsinfo = await getUserTagsInfo([user_id]);
    const tags = userTagsinfo.find(e => {
        return e.user_id === user_id;
    }).tags;

    // 用户信息
    const user_info = {
        avatar: avatar_url,
        nickname,
        tags
    }

    // 获取帖子图片
    const { result: imagesResult } = await query(`SELECT * FROM ${TEAM_POST_IMAGES} WHERE post_id = ?`, [post_id]);
    let images = [];
    if (imagesResult.length > 0) {
        images = imagesResult.map(e => {
            return {
                image_id: e.image_id,
                image_url: e.image_url,
            }
        });
    }

    // 行程图片
    const { result: routeResult } = await query(`SELECT * FROM ${ITINERARIES} WHERE post_id = ?`, [post_id]);
    let itinerary = '';
    if (routeResult.length > 0) {
        itinerary = routeResult[0].image_url;
    }


    // 获取帖子评论
    const sql4 = `SELECT * FROM ${TEAM_POST_COMMENTS} WHERE post_id = ?`;
    const { result: commentResult } = await query(sql4, [post_id]);
    // [{comment_id, user_id, content, created_at}...]

    let comments = [];
    if (commentResult.length > 0) {
        comments = Promise.all(commentResult.map(async (cmoment) => {
            const { nickname, avatar_url } = await getUserInfo(content.user_id);
            return {
                ...cmoment,
                user_info: {
                    user_id: cmoment.user_id,
                    nickname,
                    avatar: avatar_url
                }
            };
        }))
    }

    // 获取帖子点赞
    // like userids
    const sql5 = `SELECT * FROM ${TEAM_POST_LIKES} WHERE post_id = ?`;
    const { result: likeResult } = await query(sql5, [post_id]);
    const like_userIds = likeResult.map(e => e.user_id);


    try {


        res.status(200).json({
            code: 200, msg: '查询帖子成功', data: {
                post: {
                    post_id,
                    title,
                    description,
                    start_location,
                    end_location,
                    duration_day,
                    team_size,
                    estimated_expense,
                    gender_requirement,
                    payment_method,
                    theme_id,
                    itinerary,
                    created_at,
                    user_info,
                    images,
                    like_userIds,
                    comments
                }
            }
        });
    } catch (error) {

    }
}

// 查询分页帖子列表

const getDynamicPostsForPage = async (req, res) => {


}
const getTeamPostsForPage = async (req, res) => {

}



// 删除帖子

const deleteDynamicPost = async (req, res) => {


}

const deleteTeamPost = async (req, res) => {

}


module.exports = {
    publishDynamicPost, updateDynamicPost, deleteDynamicPost, getDynamicPost, getDynamicPostsForPage,
    publishTeamPost, updateTeamPost, deleteTeamPost, getTeamPost, getTeamPostsForPage,
}