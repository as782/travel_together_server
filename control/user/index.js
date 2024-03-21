const { TEAM_ACTIVITY_PARTICIPANTS, TEAM_ACTIVITY_POSTS, USERS, USER_FOLLOWS, DYNAMIC_POSTS, DYNAMIC_POST_IMAGES, TEAM_ACTIVITY_IMAGES } = require('../../db/config');
const { query } = require('../../db/index');
const getUserTagsInfo = require('../utils/getUserTags');
const isExistINTable = require('../utils/isExistUserAndPost');
// API handle function

/**
 * 关注或取消关注用户
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {string} action 动作，1 表示关注，0 表示取消关注
 */
const followOrUnfollowUser = async (req, res) => {
    const { follower_id, following_id, action } = req.body;

    try {
        let sql, message;
        if (action === 1) {
            sql = `INSERT INTO ${USER_FOLLOWS} (follower_id, following_id) VALUES (?, ?)`;
            message = '关注成功';
        } else if (action === 0) {
            sql = `DELETE FROM ${USER_FOLLOWS} WHERE follower_id = ? AND following_id = ?`;
            message = '取消关注成功';
        } else {
            return res.status(400).json({ code: 400, msg: '无效的操作' });
        }

        await query(sql, [follower_id, following_id]);
        res.status(200).json({ code: 200, msg: message });
    } catch (error) {
        console.error(`${action === 'follow' ? '关注' : '取消关注'}用户失败:`, error);
        res.status(500).json({ code: 500, msg: `${action === 'follow' ? '关注' : '取消关注'}用户失败` });
    }
}

module.exports = {
    followOrUnfollowUser
};


const getFollowers = async (req, res) => {
    const userId = req.params.user_id;
    if (!userId) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }
    try {

        const { result: followResult } = await query('SELECT * FROM user_follows WHERE follower_id = ?', [userId]);

        const followUserIds = followResult.map(follow => follow.following_id);

        if (!followUserIds.length) {
            return res.status(200).json({
                code: 200, msg: '暂无关注用户', data: {
                    follows: []
                }
            });
        }
        // 关注用户的info
        const { result: followUserResults } = await query('SELECT * FROM users WHERE user_id IN (?)', [followUserIds]);
        // 每个用户的标签信息
        const followersUserTagsInfoList = await getUserTagsInfo(followUserIds);


        // 整合关注用户信息
        const fansUserInfoList = followUserResults.map((fansUserInfo) => {
            const { user_id, username, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = fansUserInfo;
            const tags = followersUserTagsInfoList.find(e => {
                return e.user_id === user_id;
            }).tags;

            const user_info = {
                user_id,
                username,
                avatar_url,
                nickname,
                gender,
                bio,
                birthday,
                tags,
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
            return user_info
        });

        res.status(200).json(
            {
                code: 200,
                msg: '关注列表信息获取成功',
                data: {
                    follows: fansUserInfoList
                }
            }
        )
    } catch (error) {
        console.log('关注列表信息获取失败', error);
        res.status(500).json({
            code: 500,
            msg: '关注列表信息获取失败' + error,
            data: null
        })
    }
}

const getFans = async (req, res) => {
    const userId = req.params.user_id;
    if (!userId) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }
    try {

        const { result: fansResult } = await query('SELECT * FROM user_follows WHERE following_id = ?', [userId]);
        const fansUserIds = fansResult.map(follow => follow.follower_id);

        if (!fansUserIds.length) {
            return res.status(200).json({
                code: 200, msg: '暂无粉丝', data: {
                    fans: []
                }
            });
        }
        // 关注用户的info
        const { result: fansUserResult } = await query('SELECT * FROM users WHERE user_id IN (?)', [fansUserIds]);

        // 每个用户的标签信息
        const fansUserTagsInfoList = await getUserTagsInfo(fansUserIds);

        // 整合粉丝用户信息
        const fansUserInfoList = fansUserResult.map((fansUserInfo) => {
            const { user_id, username, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = fansUserInfo;
            const tags = fansUserTagsInfoList.find(e => {
                return e.user_id === user_id;
            }).tags;
            const user_info = {
                user_id,
                username,
                avatar_url,
                nickname,
                gender,
                bio,
                birthday,
                tags,
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
            return user_info
        });

        res.status(200).json(
            {
                code: 200,
                msg: '粉丝列表信息获取成功',
                data: {
                    fans: fansUserInfoList
                }
            }
        )
    } catch (error) {

        res.status(500).json({
            code: 500,
            msg: '粉丝列表信息获取失败' + error,
            data: null
        })
    }
}

const getUserInfo = async function (req, res, next) {
    let userId = req.params.id;
    if (!userId) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }
    let sql = 'SELECT * FROM users WHERE user_id = ?';
    try {
        let { result: userResult } = await query(sql, [userId]);
        if (!userResult.length) {
            return res.status(400).json({ code: 400, msg: '用户不存在' });
        }
        const user_id = userResult[0].user_id;
        // 每个用户的标签信息
        const userTagsInfoList = await getUserTagsInfo([user_id]);
        const tags = userTagsInfoList.find(e => {
            return e.user_id === user_id;
        }).tags;

        const { avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = userResult[0];
        const user_info = {
            user_id,
            username: userResult[0].username,
            avatar_url,
            nickname,
            gender,
            bio,
            birthday,
            tags: tags,
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
        res.status(200).json({
            code: 200,
            msg: '获取用户信息成功',
            data: user_info
        });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }
}

const updateUserInfo = async (req, res, next) => {
    try {
        const { user_id, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, tags } = req.body;

        // 检查用户是否存在
        const { result: userExists } = await query('SELECT COUNT(*) AS count FROM users WHERE user_id = ?', [user_id]);
        if (userExists[0].count === 0) {
            return res.status(400).json({ code: 400, msg: '用户不存在' });
        }

        // 更新用户信息
        const updateSql = `
            UPDATE users 
            SET avatar_url = ?, nickname = ?, gender = ?, bio = ?, birthday = ?, region_name = ?, region_code = ?, contact_phone = ?, contact_email = ?
            WHERE user_id = ?;
        `;
        await query(updateSql, [avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, user_id]);

        // 检查是否存在标签并更新用户标签信息
        if (Array.isArray(tags) && tags.length > 0) {
            // 检查标签是否存在
            const invalidTags = [];
            for (const tagId of tags) {
                const { result: tagExists } = await query('SELECT COUNT(*) AS count FROM tags WHERE tag_id = ?', [tagId]);
                if (tagExists[0].count === 0) {
                    invalidTags.push(tagId);
                }
            }
            if (invalidTags.length > 0) {
                return res.status(400).json({ code: 400, msg: `标签 ${invalidTags.join(', ')} 不存在` });
            }

            // 更新用户标签信息
            const deleteTagsSql = 'DELETE FROM user_tags WHERE user_id = ?';
            await query(deleteTagsSql, [user_id]);

            const insertTagsSql = 'INSERT INTO user_tags (user_id, tag_id) VALUES ?';
            const tagValues = tags.map(tagId => [user_id, tagId]);
            await query(insertTagsSql, [tagValues]);
        }

        res.status(200).json({ code: 200, msg: '用户信息更新成功' });
    } catch (error) {
        res.status(500).json({ code: 500, msg: '服务器错误 ' + error.message });
    }
};

/**
 * 加入小队
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.user_id 用户 ID
 * @param {number} req.body.post_id 组队帖子 ID
 */
const joinTeam = async (req, res) => {
    const { user_id, post_id } = req.body;

    try {
        // 检查用户和帖子是否存在
        const [userResult, postResult] = await Promise.all([
            isExistINTable(USERS, { user_id }),
            isExistINTable(TEAM_ACTIVITY_POSTS, { post_id })
        ]);

        if (!userResult) {
            return res.status(400).json({ code: 400, msg: '用户不存在' });
        }

        if (!postResult) {
            return res.status(400).json({ code: 400, msg: '组队帖子不存在' });
        }

        // 检查用户是否已经加入小队
        const joinCheckSql = `SELECT * FROM ${TEAM_ACTIVITY_PARTICIPANTS} WHERE user_id = ? AND post_id = ?`;
        const { result: existingJoin } = await query(joinCheckSql, [user_id, post_id]);

        if (existingJoin.length > 0) {
            return res.status(400).json({ code: 400, msg: '用户已经加入小队' });
        }

        // 将加入小队记录插入数据库
        const insertJoinSql = `INSERT INTO ${TEAM_ACTIVITY_PARTICIPANTS} (post_id, user_id) VALUES (?, ?)`;
        await query(insertJoinSql, [post_id, user_id]);

        res.status(200).json({ code: 200, msg: '加入小队成功' });
    } catch (error) {
        console.error('加入小队失败:', error);
        res.status(500).json({ code: 500, msg: '加入小队失败' });
    }
}

/**
 * 获取用户加入的小队信息
 * @param {*} req 
 * @param {*} res 
 * @param {number} req.body.page 请求页码
 * @param {number} req.body.limit 每页大小
 * @param {number} req.body.user_id 用户ID
 */
const getUserTeams = async (req, res) => {
    const { user_id, page = 1, limit = 10 } = req.body;
    try {
        // 查询总数
        const totalTeamsCountSql = `
            SELECT COUNT(*) AS count
            FROM ${TEAM_ACTIVITY_PARTICIPANTS}
            WHERE user_id = ?`;
        const { result: totalTeamsCount } = (await query(totalTeamsCountSql, [user_id]));

        // 计算分页偏移量
        const offset = (page - 1) * limit;

        // 查询小队信息及其相关图片
        const teamsSql = `
            SELECT t.*, GROUP_CONCAT(ti.image_url) AS images
            FROM ${TEAM_ACTIVITY_POSTS} t
            LEFT JOIN ${TEAM_ACTIVITY_IMAGES} ti ON t.post_id = ti.post_id
            WHERE t.post_id IN (
                SELECT post_id
                FROM ${TEAM_ACTIVITY_PARTICIPANTS}
                WHERE user_id = ?
            )
            GROUP BY t.post_id
            ORDER BY t.created_at ASC
            LIMIT ? OFFSET ?`;
        const { result: userTeams } = await query(teamsSql, [user_id, limit, offset]);

        // 处理帖子图片
        userTeams.forEach(team => {
            team.images = team.images ? team.images.split(',') : [];
        });

        res.status(200).json({
            code: 200,
            data: {
                list: userTeams,
                pageSize: limit,
                totalCount: totalTeamsCount[0].count,
                totalPages: Math.ceil(totalTeamsCount[0].count / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('Error fetching user teams:', error);
        res.status(500).json({ code: 500, msg: 'Failed to fetch user teams' });
    }
};


/**
 * 获取我的发布
 * @param {Object} req 请求对象
 * @param {Object} res 响应对象
 * @param {number} req.body.page 请求页码
 * @param {number} req.body.limit 每页大小
 * @param {number} req.body.user_id 用户ID
 */
const getMyPosts = async (req, res) => {
    try {
        const { user_id, page = 1, limit = 10 } = req.body;

        // 查询总数
        const teamPostsCountSql = `
            SELECT COUNT(*) AS count
            FROM ${TEAM_ACTIVITY_POSTS}
            WHERE user_id = ?`;
        const dynamicPostsCountSql = `
            SELECT COUNT(*) AS count
            FROM ${DYNAMIC_POSTS}
            WHERE user_id = ?`;

        const { result: teamPostsCount } = await query(teamPostsCountSql, [user_id]);
        const { result: dynamicPostsCount } = await query(dynamicPostsCountSql, [user_id]);

        const totalCount = teamPostsCount[0].count + dynamicPostsCount[0].count;

        // 计算分页偏移量
        const offset = (page - 1) * limit;

        // 查询组队帖子及其相关图片
        const teamPostsSql = `
            SELECT t.*, GROUP_CONCAT(ti.image_url) AS images
            FROM ${TEAM_ACTIVITY_POSTS} t
            LEFT JOIN ${TEAM_ACTIVITY_IMAGES} ti ON t.post_id = ti.post_id
            WHERE t.user_id = ?
            GROUP BY t.post_id
            ORDER BY t.created_at ASC
            LIMIT ? OFFSET ?`;
        const { result: teamPosts } = await query(teamPostsSql, [user_id, limit, offset]);

        // 查询动态帖子及其相关图片
        const dynamicPostsSql = `
            SELECT d.*, GROUP_CONCAT(di.image_url) AS images
            FROM ${DYNAMIC_POSTS} d
            LEFT JOIN ${DYNAMIC_POST_IMAGES} di ON d.dynamic_post_id = di.dynamic_post_id
            WHERE d.user_id = ?
            GROUP BY d.dynamic_post_id
            ORDER BY d.created_at ASC
            LIMIT ? OFFSET ?`;
        const { result: dynamicPosts } = await query(dynamicPostsSql, [user_id, limit, offset]);

        // 处理帖子图片
        teamPosts.forEach(post => {
            post.images = post.images ? post.images.split(',') : [];
        });
        dynamicPosts.forEach(post => {
            post.images = post.images ? post.images.split(',') : [];
        });

        // 合并结果并返回
        const myPosts = [...teamPosts, ...dynamicPosts];
        res.status(200).json({
            code: 200, msg: '获取我的发布成功', data: {
                list: myPosts,
                pageSize: limit,
                totalCount: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: parseInt(page)
            }
        });
    } catch (error) {
        console.error('获取我的发布失败:', error);
        res.status(500).json({ code: 500, msg: '获取我的发布失败' });
    }
}


module.exports = {
    getUserInfo,
    getFollowers,
    getFans,
    updateUserInfo,
    joinTeam,
    followOrUnfollowUser,
    getMyPosts,
    getUserTeams
}