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

module.exports = config;