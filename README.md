# 基于快速傅里叶变换实现的狗声识别器
### 开发背景
市场上很多狗声，猫声，动物声音翻译器，它们没有采用正确的技术去实现，从而让动物声音翻译器变成人们笑料的工具。本人为了改变现状，刚好被裁员在家里休息，所以努力开发一款真正意义上能识别出动物声音的翻译器。总计耗时1个月，躺了几次中医推拿才初步开发完成。整体只完成梦想的一小步，后续只能交给追梦者继续完善。
### 功能介绍
可以识别出包括狗狗在内的所有动物发出的声音，前提是先录音存到声音档案里面。

### 预览网址
使用手机火狐浏览器访问 https://app.jiajuren.net/  同意开启录音和麦克风权限。

### 运行项目
nginx+ssl+php+mysql

创建bowwow数据库 `CREATE DATABASE bowwow;` 然后执行根目录bowwow.sql文件，接着把`app copy.json`修改为`app.json`并且配置mysql连接参数

在根目录运行 php -S 0.0.0.0:13000 -t .
nginx反向代理到13000端口
参考配置
```sh
server {
	listen 3000 ssl http2;
	ssl_certificate /web/linux/vscode/ssl/server.crt;
    ssl_certificate_key /web/linux/vscode/ssl/server.key;
	add_header Access-Control-Allow-Origin *;
	server_name 0.0.0.0;
	index index.php index.html index.htm index.nginx-debian.html;
	location / {
		proxy_pass http://127.0.0.1:13000;
	}
}
```
最后访问https://127.0.0.1:3000 即可看到本地效果
### 注意事项
必须要https才能开启录音和麦克风权限

需要安静室内环境，录音要自然，识别时的发音要跟录音时的节奏一致。这样子才能达到80%识别率。室外在噪音干扰下，识别率几乎为0。

# :star:捐赠
如果这个应用能帮助到您，请 Star 一下。

您也可以使用微信打赏作者：

![](storage/files/images/wxzhifu.jpg) 
