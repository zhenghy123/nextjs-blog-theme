import { PlayerEvents } from './player-events'
import { InteractiveEnums } from './player-interactives'
import { DefaultVideoOptions } from './player-config'
import { PlayerParse } from './player-json-parse'
import { PlayerUI } from './player-ui'
import EventEmitter from 'events'

var _krpano = null

// 互动视频VR播放器
export class KPlayer {
  constructor(options = {}) {
    this._krpano = options.krpano
    this._options = {
      ...DefaultVideoOptions,
      ...options,
      ispreview: options.ispreview || false,
      showUI: options.showUI || false,
    }

    this._emitter = new EventEmitter()

    _krpano = options.krpano

    this.init()
    
    if (options.vr != '2d') {
      this.initVideo()
      this._plugin = _krpano.plugin.getItem('video')
    } else {
      this._plugin = _krpano.layer.getItem('video2d')
    }
  }

  init() {
    _krpano.global.ispreview = this._options.ispreview

    Object.defineProperty(this._options, 'ispreview', {
      set(val) {
        _krpano.global.ispreview = val
        // 预览模式下去除选中框
        val && this.displayAllBorder()
      },
      get() {
        return _krpano.global.ispreview
      },
    })

    Object.defineProperty(this._options, 'showFovSet', {
      set(val) {
        _krpano.global.showFovSet = val
        that.toggleFovSetScreen(val)
      },
      get() {
        return that._options.showFovSet
      },
    })

    window.hotspotClick = this.hotspotClick.bind(this)
    window.setMainFov = this.setMainFov.bind(this)
    window.draghotspot = this.draghotspot.bind(this)

    this.loadJson = this.loadJson.bind(this)
  }

  loadJson(json, type = 'gb', vr = '3d') {
    this._playerParse = new PlayerParse(json, this, type, vr)
    this._playerUI = new PlayerUI(this)
  }

  draghotspot(name) {
    let pos = {}
    let obj = _krpano.hotspot.getItem(name) || _krpano.layer.getItem(name)
    if (obj.flag == 'layer') {
      pos.x = obj.x.replace('%', '')
      pos.y = obj.y.replace('%', '')
    } else {
      pos.x = obj.ath
      pos.y = obj.atv
      pos.z = obj.depth
    }

    if (this._options.draghotspot) {
      this._options.draghotspot(obj.compid, name, obj.flag, pos)
    }
  }

  hotspotClick(name, type) {
    let layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (
        item.name.indexOf('border_') != -1 &&
        item.name !== 'border_' + name
      ) {
        item.visible = false
      }
    })

    if (this._options.hotspotClick) {
      this._options.hotspotClick(name, type)
    }
  }

  displayAllBorder() {
    const layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (item.name.indexOf('border_') != -1) {
        item.visible = false
      }
    })
  }

  initVideo() {
    // addplugin是异步操作，不能马上获取到添加的plugin对象
    let _this = this

    const checkPluginInit = () => {
      let videoPlugin = _krpano.plugin.getItem('video')
      if (videoPlugin) {
        let video = this.createVideo(_this._options.url)
        console.error('init video ', video.currentTime, _this._options.url)
        videoPlugin.DefaultVideoOptions = DefaultVideoOptions
        videoPlugin.PlayerEvents = PlayerEvents
        videoPlugin._emitter = _this._emitter
        videoPlugin._emit = _this._emitter.emit
        // videoPlugin.events = this._options.events
        videoPlugin.videourl = video
        videoPlugin.videoId = _this._options.videoId
        videoPlugin.url = 'plugins/videoplayer_basic_source.js'
      } else {
        setTimeout(checkPluginInit, 500)
      }
    }
    checkPluginInit()
  }

  createVideo(url) {
    let video = null
    if (typeof url == 'object') {
      video = url
    } else {
      video = document.createElement('video')
      video.src = url
    }
    video.crossOrigin = 'anonymous'
    video.preload = true
    video.oncanplay = () => {
      video.currentTime = 0.001
    }

    if (video.src.indexOf('.m3u8') != -1) {
      var hls = new window.Hls()
      hls.loadSource(video.src)
      hls.attachMedia(video)
      hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
        console.log('==', window.Hls.Events.MANIFEST_PARSED)
      })
    }

    return video
  }

  checkVideoPluginIsInit() {
    let count = 0
    let timer = null
    return new Promise((resolve) => {
      let isLoad = () => {
        let obj =
        _krpano.plugin.getItem('video') &&
        _krpano.plugin.getItem('video').togglevideo
        if (obj) {
          resolve(true)
        } else {
          count++
          if (count >= 50) {
            clearTimeout(timer)
            throw new Error('资源加载失败，请刷新浏览器重试')
          }

          timer = setTimeout(isLoad, 300)
        }
      }
      isLoad()
    })
  }

  checkVideoInit(video) {
    let count = 0
    let timer = null
    return new Promise((resolve) => {
      let isLoad = () => {
        if (video.readyState == 4 && video.videoWidth) {
          resolve(true)
        } else {
          count++
          if (count >= 50) {
            clearTimeout(timer)
            throw new Error('资源加载失败，请刷新浏览器重试')
          }
          timer = setTimeout(isLoad, 100)
        }
      }
      isLoad()
    })
  }

  setVideoSrc() {
    this._plugin.videourl = this._options.url
  }

  setVideoSecVr(url){
    _krpano.actions.removelayer('video2d', true)
    _krpano.call(
      `
      addlayer('video2d');
      set(layer['video2d'].videourl,${url});
      set(layer['video2d'].x,'0');
      set(layer['video2d'].y,'0');
      set(layer['video2d'].width,'100%');
      set(layer['video2d'].height,'100%');
      set(layer['video2d'].url,'./plugins/videoplayer.js');
      `
    )
    this._plugin = _krpano.layer.getItem('video2d')
  }

  changeVideo(url) {
    // 防止为注册完就调用
    this.checkVideoPluginIsInit().then(() => {
      if (typeof url == 'object') {
        this.checkVideoInit(url).then(() => {
          _krpano.plugin.getItem('video').togglevideo(url)
        })
      } else {
        _krpano.plugin.getItem('video').togglevideo(url)
      }
    })
    this._plugin = _krpano.plugin.getItem('video')
  }

  toggleFovSetScreen(val) {
    _krpano.layer.getItem('view_frame').visible = val
  }

  /**
   * 设置并返回场景主视角
   * 不传则返回视角信息
   */
  setMainFov(view) {
    if (view) {
      let _view = typeof view == 'string' ? JSON.parse(view) : view
      _krpano.view.hlookat = _view.hlookat || _krpano.view.hlookat
      _krpano.view.vlookat = _view.vlookat || _krpano.view.vlookat
      _krpano.view.fov = _view.fov || 90
    } else {
      view = _krpano.view
    }

    if (this._options.setMainFov) {
      let str = JSON.stringify({
        hlookat: view.hlookat,
        vlookat: view.vlookat,
        fov: view.fov,
      })
      this._options.setMainFov(str)
    }

    return {
      hlookat: view.hlookat,
      vlookat: view.vlookat,
      fov: view.fov,
    }
  }

  play() {
    this._plugin.play()
  }

  pause() {
    this._plugin.pause()
  }

  update() {
    this._plugin.update()
  }

  setCurrentTime(time) {
    this._plugin.time = time
  }

  getCurrentTime() {
    return this._plugin.time
  }

  getVideoId() {
    return this._plugin.videoId
  }

  /**
   * 添加互动组件
   * @param {*} info 参考互动组件JSON.json
   */
  addComponent(info) {
    if (info.baseSetting.type == 'Interactive') {
      info.interactiveGroup.map((group) => {
        const hotSpot = this.getHotspot(group.id)
        // 修改组件属性
        if (hotSpot) {
          if (info.baseSetting.name == '文本') {
            this.setTextComp(
              group.id,
              info.baseSetting.angleFollow ? 'layer' : 'hotspot',
              group.styleSetting,
              group.textSetting,
              group.transform3DSetting,
              group.filterSetting
            )
          } else if (
            info.baseSetting.name == '点击' ||
            info.baseSetting.name == '组合点击'
          ) {
            this.setOptionBranchComp(
              group.id,
              info.baseSetting.angleFollow ? 'layer' : 'hotspot',
              group.styleSetting,
              group.textSetting,
              group.transform3DSetting,
              group.filterSetting
            )
          }
        } else {
          this.addInteractiveHotspot(
            group.id,
            info.baseSetting.name,
            info.baseSetting.angleFollow ? 'layer' : 'hotspot',
            group.styleSetting,
            group.textSetting,
            group.transform3DSetting
          )
        }
      })
    }
  }

  /**
   * 添加互动组件热点（会绑定title plugin,border plugin）
   * @param {String} name 热点名（唯一标识，不能以数字开头哦）
   * @param {String} compName 组件类型名（如单击）
   * @param {String} type 热点类型（hotspot,layer）
   * @param {Object} styleSetting 组件背景信息
   * @param {Object} textSetting 组件文本信息
   * @param {Object} transform3DSetting 组件变换信息
   */
  addInteractiveHotspot(
    name,
    compName,
    type,
    styleSetting = null,
    textSetting = null,
    transform3DSetting = null
  ) {
    if (!name) {
      throw new Error('can not find name param')
    }

    if (!compName) {
      throw new Error('can not find compName param')
    }

    if (!type) {
      throw new Error('can not find type param')
    }

    if (compName == 'TextModule') {
      this.addTextComp(
        name,
        compName,
        type,
        styleSetting,
        textSetting,
        transform3DSetting
      )
    } else if (compName == 'PointClickModule') {
      this.addOptionBranchComp(
        name,
        compName,
        type,
        styleSetting,
        textSetting,
        transform3DSetting
      )
    } else if (compName == 'ClickGroupModule') {
      this.addOptionBranchComp(
        name,
        compName,
        type,
        styleSetting,
        textSetting,
        transform3DSetting
      )
    }

    return {
      name: name,
      tooltipname: 'tooltip_' + name,
      bordername: 'border_' + name,
    }
  }

  /**
   * 添加文字热点
   */
  addTextComp(
    name,
    compName,
    type,
    styleSetting,
    textSetting,
    transform3DSetting
  ) {
    if (type == 'hotspot') {
      _krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].type,text);
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].edge,center);
        set(hotspot[${name}].bg,false);
        set(hotspot[${name}].visible,false);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,true);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        set(hotspot[${name}].onloaded,add_all_the_time_border);
        set(hotspot[${name}].zorder,'99');
        `
      )
    } else {
      // 注意layer的scale需要加到css上
      _krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].type,text);
        set(layer[${name}].keep,true);
        set(layer[${name}].zoom,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].bg,false);
        set(layer[${name}].visible,false);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].autowidth,auto);
        set(layer[${name}].autoheight,auto);
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        set(layer[${name}].onloaded,add_all_the_time_border);
        set(layer[${name}].zorder,'99');
        `
      )
    }
    this.setTextComp(
      name,
      compName,
      type,
      styleSetting,
      textSetting,
      transform3DSetting
    )
  }

  /**
   * 添加选项分支组件
   */
  addOptionBranchComp(
    name,
    compName,
    type,
    styleSetting,
    textSetting,
    transform3DSetting
  ) {
    if (type == 'hotspot' && this._options.vr != '2d') {
      _krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].compName,${compName});
        set(hotspot[${name}].type,image);
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].edge,center);
        set(hotspot[${name}].visible,false);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,true);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        set(hotspot[${name}].onloaded,add_all_the_time_tooltip);
        set(hotspot[${name}].zorder,'99');
        `
      )
    } else {
      // 注意layer的scale需要加到css上
      _krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].compName,${compName});
        set(layer[${name}].type,image);
        set(layer[${name}].keep,true);
        set(layer[${name}].zoom,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].visible,false);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        set(layer[${name}].onloaded,add_all_the_time_tooltip);
        set(layer[${name}].zorder,'99');
        `
      )
    }
    this.setOptionBranchComp(
      name,
      compName,
      type,
      styleSetting,
      textSetting,
      transform3DSetting
    )
  }

  /**
   * 设置文本组件属性值
   */
  setTextComp(
    name,
    type,
    styleSetting,
    textSetting,
    transform3DSetting,
    filterSetting
  ) {
    // 后面如果需要设置别的再加
    //   let css = {
    //     // align: textSetting.align,
    //     color: textSetting.fill,
    //     'font-size': textSetting.fontSize + 'px',
    //     // 'font-family': textSetting.fontFamily,
    //     // 'font-style': textSetting.fontStyle,
    //     // 'text-decoration': textSetting.textDecoration,
    //     scale: transform3DSetting?.scaleX || 1,
    //   };
    //   params.css = css;
    // }

    if (type == 'hotspot') {
      _krpano.call(
        `
        set(hotspot[${name}].ath,${transform3DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform3DSetting?.y || 0});
        set(hotspot[${name}].depth,${transform3DSetting?.z || 200});
        set(hotspot[${name}].rx,${transform3DSetting?.rotateX || 0});
        set(hotspot[${name}].ry,${transform3DSetting?.rotateY || 0});
        set(hotspot[${name}].rz,${transform3DSetting?.rotateZ || 0});
        set(hotspot[${name}].scale,${transform3DSetting?.scaleX || 1});
        set(hotspot[${name}].alpha,${1 - filterSetting?.alpha || '1'});
        set(hotspot[${name}].html,${textSetting?.text || '默认文本'});
        set(hotspot[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;");
        `
      )
    } else {
      _krpano.call(
        `
        set(layer[${name}].x,${
          transform3DSetting?.x ? transform3DSetting?.x + '%' : '50%'
        });
        set(layer[${name}].y,${
          transform3DSetting?.y ? transform3DSetting?.y + '%' : '50%'
        });
        set(layer[${name}].rotate,${transform3DSetting?.rotate || 0});
        set(layer[${name}].alpha,${1 - filterSetting?.alpha || '1'});
        set(layer[${name}].html,${textSetting?.text || '默认文本'});
        set(layer[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;scale:${
          transform3DSetting?.scaleX || 1
        }");
        `
      )
    }
  }

  setOptionBranchComp(
    name,
    compName,
    type,
    styleSetting,
    textSetting,
    transform3DSetting,
    filterSetting
  ) {
    if (type == 'hotspot' && this._options.vr != '2d') {
      _krpano.call(
        `
        set(hotspot[${name}].ath,${transform3DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform3DSetting?.y || 0});
        set(hotspot[${name}].depth,${transform3DSetting?.z || 800});
        set(hotspot[${name}].width,${transform3DSetting?.width || '100'});
        set(hotspot[${name}].height,${transform3DSetting?.height || '100'});
        set(hotspot[${name}].rx,${transform3DSetting?.rotateX || 0});
        set(hotspot[${name}].ry,${transform3DSetting?.rotateY || 0});
        set(hotspot[${name}].rz,${transform3DSetting?.rotateZ || 0});
        set(hotspot[${name}].url,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[compName].beforeTrigger
        });
       set(hotspot[${name}].beforeTrigger,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[compName].beforeTrigger
        });
       set(hotspot[${name}].triggering,${
          styleSetting?.triggering || InteractiveEnums[compName].triggering
        });
        set(hotspot[${name}].afterTrigger,${
          styleSetting?.afterTrigger || InteractiveEnums[compName].afterTrigger
        });
        set(hotspot[${name}].text,${textSetting?.text || ''}); 
        set(hotspot[${name}].html,${textSetting?.text || ''});
        set(hotspot[${name}].alpha,${1 - filterSetting?.alpha || '1'});
        set(hotspot[${name}].scale,${transform3DSetting?.scaleX || 1});
        `
      )
      this.checkHasLoaded('tooltip_' + name, 'layer').then(() => {
        _krpano.layer.getItem('tooltip_' + name).html = textSetting?.text || ''
        _krpano.layer.getItem('tooltip_' + name).css = `color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;`
      })
    } else {
      let x = transform3DSetting?.x ? transform3DSetting?.x + '%' : '50%'
      let y = transform3DSetting?.y ? transform3DSetting?.y + '%' : '50%'
      if (type == 'hotspot') {
        x = transform3DSetting?.x / 1920 * 100 + '%' || '0'
        y = transform3DSetting?.y / 1080 * 100 + '%' || '0'
      }
      _krpano.call(
        `
         set(layer[${name}].x,${x});
        set(layer[${name}].y,${y});
        set(layer[${name}].width,${transform3DSetting?.width || '100'});
        set(layer[${name}].height,${transform3DSetting?.height || '100'});
        set(layer[${name}].rotate,${transform3DSetting?.rotate || 0});
        set(layer[${name}].url,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[compName].beforeTrigger
        });
        set(layer[${name}].beforeTrigger,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[compName].beforeTrigger
        });
         set(layer[${name}].triggering,${
          styleSetting?.triggering || InteractiveEnums[compName].triggering
        });
        set(layer[${name}].afterTrigger,${
          styleSetting?.afterTrigger || InteractiveEnums[compName].afterTrigger
        });
        set(layer[${name}].text,${textSetting?.text || ''});
        set(layer[${name}].html,${textSetting?.text || ''});
        set(layer[${name}].alpha,${1 - filterSetting?.alpha || '1'});
        set(layer[${name}].scale,${transform3DSetting?.scaleX || 1});
        `
      )
      this.checkHasLoaded('tooltip_' + name, 'layer').then(() => {
        _krpano.layer.getItem('tooltip_' + name).html = textSetting?.text || ''
        _krpano.layer.getItem('tooltip_' + name).css = `color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;`
      })
    }
  }

  checkHasLoaded(name, type = 'hotspot') {
    return new Promise((resolve, reject) => {
      let count = 0
      let isLoad = () => {
        let obj =
          type == 'hotspot'
            ? _krpano.hotspot.getItem(name)
            : _krpano.layer.getItem(name)
        if (obj) {
          resolve(name)
        } else {
          count++
          if (count >= 10) {
            reject(false)
            return
          }
          setTimeout(isLoad, 300)
        }
      }
      isLoad()
    })
  }

  // 获取屏幕中心layer坐标
  getCenterLayerPos() {
    let id = _krpano.embeddingsettings.id
    let width = document.getElementById(id).offsetWidth
    let height = document.getElementById(id).offsetHeight
    return { x: width / 2, y: height / 2 }
  }

  // 获取屏幕中心hotspot坐标
  getCenterHotspotPos() {
    let obj = this.getCenterLayerPos()
    return this.screentosphere(obj.x, obj.y)
  }

  // ath atv to  x y
  spheretoscreen(ath, atv) {
    return _krpano.spheretoscreen(ath, atv)
  }

  // x y to ath atv
  screentosphere(x, y) {
    return _krpano.screentosphere(x, y)
  }

  // 下划线
  toMiddleLine(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase()
  }

  /**
   * 移出热点 TODO:具体移出何种类型的组件要根据标识去判断
   * @param {String} name
   */
  removeHotspot(name) {
    let hot = _krpano.hotspot.getItem(name)
    let layer = _krpano.layer.getItem(name)

    if (hot) {
      _krpano.actions.removehotspot(name)
    } else if (layer) {
      _krpano.actions.removelayer(name, true)
    }

    _krpano.actions.removeplugin('tooltip_' + name)
    _krpano.actions.removeplugin('border_' + name)
  }

  /**
   * 批量显隐热点
   * @param {Array} names
   */
  showHotspot(names = [], visible = true) {
    let hots = _krpano.hotspot.getArray()
    hots.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true
      } else {
        item.visible = false
      }
    })

    let pluginArr = ['view_frame', 'view_frame_btn', 'video', 'video2d']
    let layers = _krpano.layer
      .getArray()
      .filter(
        (item) =>
          item.name.indexOf('border_') == -1 &&
          item.name.indexOf('tooltip_') == -1 &&
          !pluginArr.includes(item.name)
      )
    layers.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true
      } else {
        item.visible = false
      }
    })
  }

  showOrHideComp(name, type, visible) {
    let arr =
      type == 'layer' ? _krpano.layer.getArray() : _krpano.hotspot.getArray()

    arr.map((item) => {
      if (name == item.name) {
        item.visible = visible
      }
    })
  }

  // 隐藏全部选择框
  hideAllBorderSelect() {
    let layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (item.name.indexOf('border_') != -1) {
        item.visible = false
      }
    })
  }

  showBorderLayer(name, visible) {
    let layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (item.name == name) {
        item.visible = visible
      } else if (item.name.indexOf('border_') != -1) {
        item.visible = false
      }
    })
  }

  /**
   * 切换场景（视频、图片、黑屏）
   * 注意：热点和插件要设置 keep:true
   * @param {String} name
   */
  changeScene(name) {
    _krpano.actions.loadscene(name)
    _krpano.plugin.getItem(0).lastCurrentTime = Math.random()
    _krpano.actions.updatescreen()
  }

  getPlugin(name) {
    return _krpano.plugin.getItem(name)
  }

  getHotspot(name, type = 'hotspot') {
    return _krpano.hotspot.getItem(name) || _krpano.layer.getItem(name)
  }
  /**
   * 清空hotspot和layer
   * 注意：krpano为版本兼容，layer和plugin是一个组件，不能删除一些预设插件
   */
  clearComp() {
    while (_krpano.hotspot.count > 0) {
      let name = _krpano.hotspot.getItem(0).name
      _krpano.actions.removehotspot(name)
    }

    let layer = _krpano.layer.getArray()
    let index = 0
    let pluginArr = ['view_frame', 'view_frame_btn', 'video']
    for (index = 0; index < layer.length; ) {
      const name = layer[index].name
      if (pluginArr.includes(name)) {
        index++
      } else {
        // _krpano.layer.removeItem(name);
        _krpano.actions.removelayer(name)
      }
    }
  }

  toggleHotspot(name, type = 'hotspot', isShow = false) {
    this.checkHasLoaded(name, type).then(() => {
      let obj =
        type == 'hotspot'
          ? _krpano.hotspot.getItem(name)
          : _krpano.layer.getItem(name)
      obj && (obj.visible = isShow)
    })
  }

  /**
   * 切换场景（视频、图片、黑屏）
   * 注意：热点和插件要设置 keep:true
   * @param {String} name
   */
  changeScene(name) {
    _krpano.actions.loadscene(name)
    _krpano.plugin.getItem(0).lastCurrentTime = Math.random()
    _krpano.actions.updatescreen()
  }

  /**
   * 销毁
   */
  destroy() {
    // video不删除
    while (_krpano.plugin.count > 1) {
      _krpano.plugin.removeItem(1)
    }

    // video不删除
    while (_krpano.layer.count > 1) {
      _krpano.hotspot.removeItem(1)
    }

    while (_krpano.hotspot.count) {
      _krpano.hotspot.removeItem(0)
    }

    // 假装销毁
    this.changeScene('noscene')

    // removepano('krpanoHTMLObject');
  }
}
