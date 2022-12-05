## kplayer


一款以krpano插件为基础的VR互动视频播放器

### 特性
- 以krpano为基础的核VR互动视频播放  
- 支持点击组合组件、选组件、文本组件
- 支持.MP4视频格式
- 支持互动因子
- 国标JSON自解析

### 快速接入
`javascriptt
<iframe src="http://36.155.98.104:12480/vr-3d-sdk-web/index.html?json=http://36.155.98.104:12480/vrnas/nas/cmam/test/cmam_vr/test/1598643252607787008/demo/video/index.json"></iframe>
`
播放器站点html后拼接国标JSON地址：?json=xxx

### krpano文档
https://krpano.com/docu/xml/

### webpack文档
https://www.webpackjs.com/configuration/


### git提交空文件夹
find ./ -type d -empty -execdir touch {}/.gitkeep {} \;
`message.js`:https://blog.csdn.net/u012131025/article/details/118085164
