var express = require('express');
const { publishDynamicPost, updateDynamicPost, deleteDynamicPost, getDynamicPost, getDynamicPostsForPage,
    publishTeamPost, updateTeamPost, deleteTeamPost, getTeamPost, getTeamPostsForPage,
} = require('../control/post/index');
var router = express.Router();

// 发布组队帖
router.post('/publishTeamPost', publishTeamPost);
// 发布动态帖
router.post('/publishDynamicPost', publishDynamicPost);
// 更新组队帖
router.post('/updateTeamPost', updateTeamPost);
// 更新动态帖
router.post('/updateDynamicPost', updateDynamicPost);
// 删除组队帖
router.get('/deleteTeamPost', deleteTeamPost);
// 删除组队帖
router.get('/deleteDynamicPost', deleteDynamicPost);
// 查询动态帖
router.get('/getDynamicPost/:dynamic_post_id', getDynamicPost);
// 查询动态帖
router.get('/getTeamPost/:post_id', getTeamPost);

// 分页查询
router.post('/getDynamicPostsForPage', getDynamicPostsForPage);
router.post('/getTeamPostsForPage', getTeamPostsForPage);
module.exports = router;
