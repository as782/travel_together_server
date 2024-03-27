var express = require('express');
const { deleteDynamicPostComment, postDynamicPostComment, deleteTeamPostComment, postTeamPostComment, getUserComments, getPostComments } = require('../control/comment');
var router = express.Router();


// 发表评论（组队帖）
router.post('/publishTeamComment',postTeamPostComment);
// 删除评论（组队帖）
router.post('/deleteTeamComment',deleteTeamPostComment);
// 发表评论（动态帖）
router.post('/publishDynamicComment',postDynamicPostComment);
// 删除评论（动态帖）
router.post('/deleteDynamicComment',deleteDynamicPostComment);

// 获取用户评论
router.post('/getUserDynamicComments', getUserComments);
// 获取帖子评论
router.post('/getPostDynamicComments', getPostComments);

module.exports = router;