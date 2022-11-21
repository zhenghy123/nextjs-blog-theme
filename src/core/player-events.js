// 视频事件
export const PlayerEvents = {
  VIDEO_LOADSTART: 'loadstart', // 开始加载数据
  VIDEO_PROGRESS: 'progress', // 正在请求数据
  VIDEO_LOADEDDATA: 'loadeddata', //媒体的第一帧已经加载完毕
  VIDEO_LOADEDMETADATA: 'loadedmetadata', //媒体的元数据已经加载完毕，现在所有的属性包含了它们应有的有效信息
  VIDEO_ABORT: 'abort', // 图像的加载被中断
  VIDEO_ERROR: 'error', // 请求数据错误
  VIDEO_STALLED: 'stalled', // 网速失速
  VIDEO_WAITING: 'waiting', // 缓冲数据
  VIDEO_CANPLAY: 'canplay', // 可以播放
  VIDEO_PLAYING: 'playing', // 在媒体开始播放时触发（不论是初次播放、在暂停后恢复、或是在结束后重新开始）
  VIDEO_CANPLAYTHROUGH: 'canplaythrough', // 可以播放，全部加载完毕
  VIDEO_SEEKING: 'seeking', // 在跳跃操作开始时触发
  VIDEO_SEEKED: 'seeked', // 在跳跃操作完成时触发
  VIDEO_TIMEUPDATE: 'timeupdate', // 时间改变
  VIDEO_ENDED: 'ended', // 播放结束
  VIDEO_RATECHANGE: 'ratechange', // 播放速度改变
  VIDEO_VOLUMECHANGE: 'volumechange', //音量改变
  VIDEO_PAUSE: 'pause', //暂停
  VIDEO_PLAY: 'play', //播放
}
