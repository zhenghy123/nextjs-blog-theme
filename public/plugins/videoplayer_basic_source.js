/*
  krpano Basic/Simplified HTML5 Videoplayer Plugin
  - for krpano 1.19
*/
// 视频事件常量

var krpanoplugin = function () {
  var local = this

  var krpano = null
  var device = null
  var plugin = null
  var video = null
  var eventFns = {}

  local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {
    krpano = krpanointerface
    device = krpano.device
    plugin = pluginobject

    // create the HTML5 video object
    // video = document.createElement('video');
    video =
      typeof plugin.videourl == 'object'
        ? plugin.videourl
        : document.createElement('video')
    // internal: provide access to the video object for usage as WebGL texture
    plugin.videoDOM = video

    if (video.currentTime == 0) {
      video.currentTime = 0.00001
    }
    // 注册属性或方法
    registerAttrFn.apply()

    // add state variables
    plugin.videowidth = 0
    plugin.videoheight = 0
    plugin.havevideosize = false
    plugin.isvideoready = false

    // setVideoOptions()
    setVideoEvents()

    // trace some debug info to the log
    krpano.debugmode = true // show debug/trace(0) messages
    krpano.trace(0, 'basic videoplayer video.src=' + video.src)

    check_ready_state()
  }

  function registerAttrFn() {
    const arr = [
      {
        key: 'videourl',
        value: plugin.videourl || '',
        setter: (val) => (video.src = val),
        getter: () => video.src,
      },
      {
        key: 'volume',
        value: plugin.volume || 1,
        setter: (val) => (video.volume = val),
        getter: () => video.volume,
      },
      {
        key: 'ispaused',
        value: video.paused,
        setter: () => {},
        getter: () => video.paused,
      },
      {
        key: 'time',
        value: video.currentTime || 0,
        setter: (val) => (video.currentTime = val),
        getter: () => video.currentTime,
      },
      {
        key: 'totaltime',
        value: plugin.duration || 0,
        setter: () => {},
        getter: () => video.duration,
      },
      {
        key: 'onvideoready',
        value: plugin.onvideoready,
        setter: null,
        getter: null,
      },
      {
        key: 'play',
        value: play,
        setter: null,
        getter: null,
      },
      {
        key: 'pause',
        value: pause,
        setter: null,
        getter: null,
      },
      {
        key: 'togglepause',
        value: togglepause,
        setter: null,
        getter: null,
      },
      {
        key: 'togglevideo',
        value: togglevideo,
        setter: null,
        getter: null,
      },
      {
        key: 'update',
        value: update,
        setter: null,
        getter: null,
      },
      {
        key: 'seek',
        value: seek,
        setter: null,
        getter: null,
      },
      {
        key: 'playvideo',
        value: playvideo,
        setter: null,
        getter: null,
      },
    ]

    arr.map((item) => {
      plugin.registerattribute(item.key, item.value, item.setter, item.getter)
    })
  }

  // 设置视频的属性值
  function setVideoOptions() {
    Object.keys(plugin.DefaultVideoOptions).map((item) => {
      console.log('==', item, plugin.options[item])
      if (plugin.options[item] != undefined) {
        video.setAttribute(item, plugin.options[item])
        plugin[item] = plugin.options[item]
      }
    })

    // 解决autoplay设置就会生效,可能会存在html video标签和video对象同时播放且播放开始时间不同
    if (!plugin.options.autoplay) {
      video.removeAttribute('autoplay')
      // plugin.videoDOM.removeAttribute("autoplay");
    }

    // 解决loop设置就会生效
    if (!plugin.options.loop) {
      video.removeAttribute('loop')
      // plugin.videoDOM.removeAttribute("loop");
    }

    // 解决muted设置就会生效
    if (!plugin.options.muted) {
      video.removeAttribute('muted')
      // plugin.videoDOM.removeAttribute("muted");
    }
    // "SecurityError: Failed to execute 'texImage2D' on 'WebGLRenderingContext': The video element contains cross-origin data, and may not be loaded."
    video.load()
  }

  // 设置视频的事件
  function setVideoEvents() {
    let events = plugin.PlayerEvents
    let keys = Object.keys(events)
    keys.map((item) => {
      eventFns[item] = (val) => {
        plugin.update()
        plugin._emitter.emit(events[item], val)
      }
      video.addEventListener(events[item], eventFns[item], false)
    })

    video.addEventListener('loadeddata', check_ready_state, false)
    video.addEventListener('loadedmetadata', check_ready_state, false)
  }

  // 注销视频监听
  function removeVideoEvents() {
    let events = plugin.PlayerEvents
    let keys = Object.keys(events)
    keys.map((item) => {
      video.removeEventListener(events[item], eventFns[item], false)
    })

    video.removeEventListener('loadeddata', check_ready_state, false)
    video.removeEventListener('loadedmetadata', check_ready_state, false)
  }

  local.unloadplugin = function () {
    if (video) {
      video.pause()

      removeVideoEvents()

      try {
        video.src = undefined
      } catch (e) {
        krpano.trace(3, 'video.src=undefined')
      }
    }

    // remove videoplayer attributes
    // delete plugin.videourl;
    // delete plugin.onvideoready;
    // delete plugin.play;
    // delete plugin.pause;
    // delete plugin.togglepause;
    // delete plugin.videowidth;
    // delete plugin.videoheight;
    // delete plugin.havevideosize;
    // delete plugin.isvideoready;
    delete plugin.videoDOM

    video = null
    plugin = null
    device = null
    krpano = null
  }

  function check_ready_state() {
    if (
      plugin &&
      plugin.havevideosize == false &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      // got a valid size

      // register the size in krpano
      plugin.registercontentsize(video.videoWidth, video.videoHeight)

      // save size and state (required internally in krpano)
      plugin.videowidth = video.videoWidth
      plugin.videoheight = video.videoHeight
      plugin.havevideosize = true
      plugin.isvideoready = true

      // internal: 'ready CallBack' for video panos
      if (plugin.onvideoreadyCB) plugin.onvideoreadyCB()

      // xml event callback
      krpano.call(plugin.onvideoready, plugin)

      plugin.lastCurrentTime = Math.random()
      krpano.actions.updatescreen()

      plugin.update()
    }
  }

  function option_setter(val, key) {
    console.log('option_setter', key, val)
    if (key == 'src' && typeof val == 'object') {
      removeVideoEvents()

      video = val
      plugin.videoDOM = val
      setVideoOptions()
      setVideoEvents()
      check_ready_state()
    } else {
      console.log(22, video)
      video.setAttribute(key, val)
    }
  }

  function option_getter(key) {
    return video[key]
  }

  function play() {
    video.play().then(() => {
      krpano.actions.updatescreen()
    })
  }

  function pause() {
    video.pause()
  }

  function seek(val) {
    video.currentTime = video.duration * val
  }

  function togglepause() {
    if (video.paused == false) {
      video.pause()
    } else {
      video.play()
    }
  }

  function update() {
    plugin.lastCurrentTime = Math.random()
    krpano.actions.updatescreen()
  }

  /**
   * 视频切换
   * 播放器不做视频提前缓存，可外部缓存好后传入地址浏览器缓存可以复用
   */
  function togglevideo(url) {
    let flag = video.paused
    plugin.videourl = url
    flag ? video.pause() : video.play()
    plugin.lastCurrentTime = Math.random()
    krpano.actions.updatescreen()
  }

  /**
   * 视频切换
   * 播放器不做视频提前缓存，可外部缓存好后传入地址浏览器缓存可以复用
   */
  function playvideo(url, posterurl, pausedonstart, starttime) {
    let flag = video.paused
    plugin.videourl = url
    plugin.posterurl = posterurl
    plugin.pausedonstart = pausedonstart
    if (video.currentTime == 0) {
      video.currentTime = 0.00001
    }
    flag ? video.pause() : video.play()
    plugin.lastCurrentTime = starttime
    krpano.actions.updatescreen()
  }
}
