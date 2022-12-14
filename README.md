## kplayer

一款以krpano插件为基础的VR互动视频播放器

### 特性
- 以krpano为基础的核VR互动视频播放  
- 支持点击组合组件、选组件、文本组件
- 支持.MP4视频格式
- 支持互动因子
- 国标JSON自解析

### 快速接入

<iframe src="http://36.155.98.104:12480/vr-3d-sdk-web/index.html?json=http://36.155.98.104:12480/vrnas/nas/cmam/test/cmam_vr/test/1598643252607787008/demo/video/index.json"></iframe>


`站点地址`：http://36.155.98.104:12480/vr-3d-sdk-web/index.html

播放器站点html后拼接国标JSON地址：?json=xxx

- 3D测试地址（mp4）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html?json=http://36.155.98.104:12480/vrnas/nas/cmam/test/cmam_vr/test/1600740490888814592/demo/video/index.json
- 3D测试地址（hls）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html
- 2D测试地址（mp4）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html?json=http://36.155.98.104:12480/vrnas/nas/cmam/test/cmam_vr/test/1600737337904668672/demo/video/index.json
- 2D测试地址（hls）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html
- url测试地址（mp4）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html?url=xx&showUI=true
- url测试地址（hls）:http://36.155.98.104:12480/vr-3d-sdk-web/index.html


### 工具
 - `yapi后台工具数据转json(暂时用于项目内部预览实现)`：http://180.167.180.242:7866/project/3216/interface/api/179467
- VR互动内容制作平台（测试环境）：http://36.155.98.104:12480/vr-video-manage-web/index.html#/workbench/mgt-interactiveVideo

`互动视频工具内部预览`:
<iframe src="http://36.155.98.104:12480/vr-3d-sdk-web/index.html" name="jsonStr"></iframe>

备注：`工具预览没有json文件，需要动态传递json数据，不能拼接到url后面因为会超长,现把json数据放到name上传递`


### git提交空文件夹
find ./ -type d -empty -execdir touch {}/.gitkeep {} \;

### 插件
- `message.js`: https://blog.csdn.net/u012131025/article/details/118085164
- `logicFlow`: http://logic-flow.org/api/logicFlowApi.html#resize
- `krpano`: https://krpano.com/docu/xml/
- `webpack`: https://www.webpackjs.com/configuration/
- `copy-webpack-plugin`: https://www.npmjs.com/package/copy-webpack-plugin

