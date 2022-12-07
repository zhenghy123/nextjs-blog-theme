/*
	krpano Basic/Simplified HTML5 Videoplayer Plugin
	- for krpano 1.19
*/
var krpanoplugin = function () {
  var local = this;

  var krpano = null;
  var device = null;
  var plugin = null;

  var video = null;

  local.registerplugin = function (krpanointerface, pluginpath, pluginobject) {
    krpano = krpanointerface;
    device = krpano.device;
    plugin = pluginobject;

    video =
      typeof plugin.videourl == 'object'
        ? plugin.videourl
        : document.createElement('video')
    // internal: provide access to the video object for usage as WebGL texture
    plugin.videoDOM = video
    video.crossOrigin = 'anonymous'

    if (plugin.videoOptions) {
      // register attributes
      plugin.registerattribute(
        'muted',
        plugin.videoOptions?.muted,
        (val) => option_setter(val, 'muted'),
        () => option_getter('muted')
      )
      plugin.registerattribute(
        'volume',
        plugin.videoOptions?.volume,
        (val) => option_setter(val, 'volume'),
        () => option_getter('volume')
      )
      plugin.registerattribute(
        'poster',
        plugin.videoOptions?.poster,
        (val) => option_setter(val, 'poster'),
        () => option_getter('poster')
      )
      plugin.registerattribute(
        'preload',
        plugin.videoOptions?.preload,
        (val) => option_setter(val, 'preload'),
        () => option_getter('preload')
      )
      plugin.registerattribute(
        'loop',
        plugin.videoOptions?.loop,
        (val) => option_setter(val, 'loop'),
        () => option_getter('loop')
      )
      plugin.registerattribute(
        'autoplay',
        plugin.videoOptions?.autoplay,
        (val) => option_setter(val, 'autoplay'),
        () => option_getter('autoplay')
      )
    }

    plugin.registerattribute("videourl", null);
    plugin.registerattribute("onvideoready", null);

    // actions
    plugin.registerattribute("play", play);
    plugin.registerattribute("pause", pause);
    plugin.registerattribute("togglepause", togglepause);
    plugin.registerattribute("togglevideo", togglevideo);
	  plugin.registerattribute('update', update)
    plugin.registerattribute('seek', seek)

    // add state variables
    plugin.videowidth = 0;
    plugin.videoheight = 0;
    plugin.havevideosize = false;
    plugin.isvideoready = false;

    video = document.createElement("video");
    video.style.width = "100%";
    video.style.height = "100%";

    video.preload = "auto";
    video.src = krpano.parsepath(plugin.videourl);

    plugin.videoDOM = video;
    if (plugin.sprite) plugin.sprite.appendChild(video);

    plugin.videoOptions && setVideoOptions()
    setVideoEvents()
    
    krpano.debugmode = true // show debug/trace(0) messages
    krpano.trace(0, 'basic videoplayer video.src=' + video.src)

    check_ready_state()
  };

  // 设置视频的属性值
  function setVideoOptions() {
    if (!plugin.videoOptions) {
      return
    }
    Object.keys(plugin.videoOptions).map((item) => {
      video.setAttribute(item, plugin.videoOptions[item])
      plugin[item] = plugin.videoOptions[item]
    })

    // 解决autoplay设置就会生效,可能会存在html video标签和video对象同时播放且播放开始时间不同
    if (!plugin.videoOptions.autoplay) {
      video.removeAttribute('autoplay')
      // plugin.videoDOM.removeAttribute("autoplay");
    }

    // 解决loop设置就会生效
    if (!plugin.videoOptions.loop) {
      video.removeAttribute('loop')
      // plugin.videoDOM.removeAttribute("loop");
    }

    // 解决muted设置就会生效
    if (!plugin.videoOptions.muted) {
      video.removeAttribute('muted')
      // plugin.videoDOM.removeAttribute("muted");
    }
    // "SecurityError: Failed to execute 'texImage2D' on 'WebGLRenderingContext': The video element contains cross-origin data, and may not be loaded."
    video.load()
  }

  // 设置视频的事件
  function setVideoEvents() {
    if (plugin.events) {
      let events = plugin.events
      let keys = Object.keys(events)
      keys.map((item) => {
        video.addEventListener(item, events[item])
      })
    }

    // events for getting the video size
    video.addEventListener('timeupdate', video_timeupdate, false)
    video.addEventListener('loadeddata', check_ready_state, false)
    video.addEventListener('loadedmetadata', check_ready_state, false)
  }

  // 注销视频监听
  function removeVideoEvents() {
    if (plugin.events) {
      let events = plugin.events
      let keys = Object.keys(events)
      keys.map((item) => {
        video.removeEventListener('on' + item, events[item])
      })
    }

    // events for getting the video size
    video.removeEventListener('timeupdate', video_timeupdate, false)
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
    // delete plugin.videoDOM;
	delete plugin.videoDOM

    video = null;
    plugin = null;
    device = null;
    krpano = null;
  };

  function check_ready_state() {
    if (
      plugin &&
      plugin.havevideosize == false &&
      video.videoWidth > 0 &&
      video.videoHeight > 0
    ) {
      // got a valid size

      // register the size in krpano
      plugin.registercontentsize(video.videoWidth, video.videoHeight);

      // save size and state (required internally in krpano)
      plugin.videowidth = video.videoWidth;
      plugin.videoheight = video.videoHeight;
      plugin.havevideosize = true;
      plugin.isvideoready = true;

      // internal: 'ready CallBack' for video panos
      if (plugin.onvideoreadyCB) plugin.onvideoreadyCB();

      // xml event callback
      krpano.call(plugin.onvideoready, plugin);
    }
  }

  function option_setter(val, key) {
    if (key == 'src' && typeof val == 'object') {
      removeVideoEvents()

      video = val
      plugin.videoDOM = val
      setVideoOptions()
      setVideoEvents()
      check_ready_state()
    } else {
      video.setAttribute(key, val)
    }
	// if (plugin.sprite) plugin.sprite.appendChild(video);
  }

  function option_getter(key) {
    return video[key]
  }

  function play() {
    video.play();
  }

  function pause() {
    video.pause();
  }

  function video_timeupdate() {
    update()
  }

  function update() {
    // krpano.actions.updatescreen()
  }

  function seek(time) {
    video.currentTime = time
    update()
  }

  function togglepause() {
    if (video.paused == false) {
      video.pause();
    } else {
      video.play();
    }
  }

  function togglevideo(url) {
    let flag = video.paused
    plugin.videourl = url
    // flag ? video.pause() : video.play()
    plugin.lastCurrentTime = Math.random()
    krpano.actions.updatescreen()
  }
};
