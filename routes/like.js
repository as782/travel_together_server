var express = require('express');
const { toggleLikeDynamicPost,
    toggleLikeTeamPost, getUserLikedDynamicPosts, getLikedDynamicPostUsers, getLikedTeamPostUsers } = require('../control/like');
var router = express.Router();


// 点赞或则取消点赞组队帖
router.post('/likeTeamPost', toggleLikeTeamPost);
// 点赞或则取消点赞动态帖
router.post('/likeDynamicPost', toggleLikeDynamicPost);

// 获取点赞用户
router.get('/getLikeDynamicPostUsers/:post_id', getLikedDynamicPostUsers);
router.get('/getLikeTeamPostUsers/:post_id', getLikedTeamPostUsers);


// 查询用户点赞的动态帖子
router.get('/getUserLikedDynamicPosts', getUserLikedDynamicPosts);
module.exports = router;