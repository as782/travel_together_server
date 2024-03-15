var express = require('express');
const { query } = require('../db');
var router = express.Router();


/**
 * @swagger
 * /users/getUserInfo/{id}:
 *   get:
 *     summary: 通过用户ID获取用户信息
 *     description: 根据用户ID获取用户的详细信息，包括基本信息、关联的标签等。
 *     tags:
 *       - 用户操作
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: 用户ID
 *     responses:
 *       '200':
 *         description: 成功获取用户信息
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserInfoResponse'
 *       '400':
 *         description: 参数错误
 *       '500':
 *         description: 服务器错误
 */
router.get('/getUserInfo/:id', async function (req, res, next) {
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
});


// 获取关注用户列表
router.get('/follows/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  if (!userId) {
    return res.status(400).json({ code: 400, msg: '参数错误' });
  }
  try {

    const { result: fansResult } = await query('SELECT * FROM user_follows WHERE follower_id = ?', [userId]);
    // console.log(fansResult);
    const fansUserIds = fansResult.map(follow => follow.following_id);
    // 关注用户的info
    const { result: fansUserResult } = await query('SELECT * FROM users WHERE user_id IN (?)', [fansUserIds]);
    // console.log(fansUserResult);
    // 关注用户的标签id
    const TagMap = new Map();

    // 查询标签信息
    const getTaginfo = async (tag_id) => {
      if (TagMap.has(tag_id)) {
        return TagMap.get(tag_id);
      }
      const { result: tagResult } = await query('SELECT * FROM tags WHERE tag_id = ?', [tag_id]);

      TagMap.set(tag_id, tagResult[0]);
      return tagResult[0];
    }

    // 查询用户标签id数组
    const getUserTagIds = async (user_id) => {
      const { result: userTagsResult } = await query('SELECT * FROM user_tags WHERE user_id = ?', [user_id]);

      const userTagIds = userTagsResult.map(userTag => userTag.tag_id);
      return userTagIds;
    }

    // 查询关注的每个用户的tagsinfo
    const fansUserTagsInfo = await Promise.all(fansUserIds.map(async (user_id) => {
      const userTagIds = await getUserTagIds(user_id);
      const userTagsInfo = await Promise.all(userTagIds.map(async (tag_id) => {
        const tagInfo = await getTaginfo(tag_id);
        return tagInfo;
      }))
      return {
        user_id,
        tags: userTagsInfo
      };
    }))


    // 整合关注用户信息
    const fansUserInfoList = fansUserResult.map((fansUserInfo) => {
      const { user_id, username, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = fansUserInfo;
      const tags = fansUserTagsInfo.find(e => {
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
})

// 获取粉丝用户列表
router.get('/fans/:user_id', async (req, res) => {
  const userId = req.params.user_id;
  if (!userId) {
    return res.status(400).json({ code: 400, msg: '参数错误' });
  }
  try {

    const { result: fansResult } = await query('SELECT * FROM user_follows WHERE following_id = ?', [userId]);
    // console.log(fansResult);
    const fansUserIds = fansResult.map(follow => follow.follower_id);
    // 关注用户的info
    const { result: fansUserResult } = await query('SELECT * FROM users WHERE user_id IN (?)', [fansUserIds]);
    // console.log(fansUserResult);
    // 关注用户的标签id
    const TagMap = new Map();

    // 查询标签信息
    const getTaginfo = async (tag_id) => {
      if (TagMap.has(tag_id)) {
        return TagMap.get(tag_id);
      }
      const { result: tagResult } = await query('SELECT * FROM tags WHERE tag_id = ?', [tag_id]);

      TagMap.set(tag_id, tagResult[0]);
      return tagResult[0];
    }

    // 查询用户标签id数组
    const getUserTagIds = async (user_id) => {
      const { result: userTagsResult } = await query('SELECT * FROM user_tags WHERE user_id = ?', [user_id]);

      const userTagIds = userTagsResult.map(userTag => userTag.tag_id);
      return userTagIds;
    }

    // 查询关注的每个用户的tagsinfo
    const fansUserTagsInfo = await Promise.all(fansUserIds.map(async (user_id) => {
      const userTagIds = await getUserTagIds(user_id);
      const userTagsInfo = await Promise.all(userTagIds.map(async (tag_id) => {
        const tagInfo = await getTaginfo(tag_id);
        return tagInfo;
      }))
      return {
        user_id,
        tags: userTagsInfo
      };
    }))


    // 整合关注用户信息
    const fansUserInfoList = fansUserResult.map((fansUserInfo) => {
      const { user_id, username, avatar_url, nickname, gender, bio, birthday, region_name, region_code, contact_phone, contact_email, created_at } = fansUserInfo;
      const tags = fansUserTagsInfo.find(e => {
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
})

module.exports = router;
