const { TEAM_ACTIVITY_PARTICIPANTS, TEAM_ACTIVITY_POSTS, USERS } = require('../../db/config');
const { query } = require('../../db/index');
const getUserTagsInfo = require('../utils/getUserTags')
// API handle function

const getFollowers = async (req, res) => {
    const userId = req.params.user_id;
    if (!userId) {
        return res.status(400).json({ code: 400, msg: '参数错误' });
    }
    try {

        const { result: followResult } = await query('SELECT * FROM user_follows WHERE follower_id = ?', [userId]);

        const followUserIds = followResult.map(follow => follow.following_id);
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
            console.log(tags);
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

        // 查询用户关联的标签ID
        const { result: userTagResult } = await query('SELECT tag_id FROM user_tags WHERE user_id = ?', [userResult[0].user_id]);

        // 获取用户关联的所有标签信息
        const userTagIds = userTagResult.map(tag => tag.tag_id);

        // 查询与用户关联的所有标签信息
        const { result: userTagsInfo } = await query('SELECT * FROM tags WHERE tag_id IN (?)', [userTagIds]);

        const { user_id, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = userResult[0];
        const user_info = {
            user_id,
            username: userResult[0].username,
            avatar_url,
            nickname,
            gender,
            bio,
            birthday,
            tags: [...userTagsInfo.map(tag => tag.tag_name)],
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
          const userCheckSql = `SELECT * FROM ${USERS} WHERE user_id = ?`;
          const postCheckSql = `SELECT * FROM ${TEAM_ACTIVITY_POSTS} WHERE post_id = ?`;
          const [userResult, postResult] = await Promise.all([
              query(userCheckSql, [user_id]),
              query(postCheckSql, [post_id])
          ]);
  
          if (userResult.result.length === 0) {
              return res.status(400).json({ code: 400, msg: '用户不存在' });
          }
  
          if (postResult.result.length === 0) {
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




module.exports = {
    getUserInfo,
    getFollowers,
    getFans,
    updateUserInfo,
    joinTeam
}