let host = '127.0.0.1';// 数据库地址
let port = '3306';// 端口
let user = 'root';// 用户名称
let password = '123456';// 用户密码
let database = 'travel';// 要链接的数据库名称     
let connectionLimit = 10;// 连接数限制
const config = {
    connectionLimit,
    host,
    port,
    user,
    password,
    database
}

// 数据库表
const USERS = 'users';
const TAGS = 'tags';
const USER_TAGS = 'user_tags';
const ADMINS = 'admins';
const USER_FOLLOWS = 'user_follows';
const DYNAMIC_POSTS = 'dynamic_posts';
const DYNAMIC_POST_IMAGES = 'dynamic_post_images';
const DYNAMIC_POST_COMMENTS = 'dynamic_post_comments';
const DYNAMIC_POST_LIKES = 'dynamic_post_likes';

const TEAM_ACTIVITY_POSTS = 'team_activity_posts';
const TEAM_ACTIVITY_IMAGES = 'team_activity_images';
const TEAM_ACTIVITY_THEMES = 'team_activity_themes';
const TEAM_ACTIVITY_POST_COMMENTS = 'team_activity_post_comments';
const TEAM_ACTIVITY_POST_LIKES = 'team_activity_post_likes';
const ITINERARIES = 'itineraries';
const TEAM_ACTIVITY_PARTICIPANTS  = "team_activity_participants"







module.exports = {
    config,
    USERS,
    TAGS,
    USER_TAGS,
    ADMINS,
    USER_FOLLOWS,
    DYNAMIC_POSTS,
    DYNAMIC_POST_IMAGES,
    DYNAMIC_POST_COMMENTS,
    DYNAMIC_POST_LIKES,
    TEAM_ACTIVITY_POSTS,
    TEAM_ACTIVITY_IMAGES,
    TEAM_ACTIVITY_THEMES,
    TEAM_ACTIVITY_POST_COMMENTS,
    TEAM_ACTIVITY_POST_LIKES,
    ITINERARIES,
    TEAM_ACTIVITY_PARTICIPANTS
};