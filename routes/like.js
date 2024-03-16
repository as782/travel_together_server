var express = require('express');
const { toggleLikeDynamicPost,
    toggleLikeTeamPost, getUserLikedDynamicPosts } = require('../control/like');
var router = express.Router();


// 点赞或则取消点赞组队帖
router.post('/likeTeamPost', toggleLikeTeamPost);
// 点赞或则取消点赞动态帖
router.post('/likeDynamicPost', toggleLikeDynamicPost);


// 查询用户点赞的动态帖子
router.get('/getUserLikedDynamicPosts', getUserLikedDynamicPosts);
module.exports = router;