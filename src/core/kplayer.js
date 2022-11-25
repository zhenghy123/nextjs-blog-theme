import { PlayerEvents } from './player-events'
import { InteractiveEnums } from './player-interactives'
import { DefaultVideoOptions } from './player-config'

import EventEmitter from 'events'

var _krpano = null

// 互动视频VR播放器
class KPlayer {
  constructor(options = {}) {
    this._krpano = options.krpano
    this._options = {
      ...DefaultVideoOptions,
      ...options,
      ispreview: options.ispreview || false,
    }

    this._emitter = new EventEmitter()

    _krpano = options.krpano
    this.init()
    this.initVideo()
  }

  init() {
    _krpano.global.ispreview = this._options.ispreview
    window.hotspotClick = this.hotspotClick.bind(this)
    window.updatetime = this.updatetime.bind(this)

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
  }

  displayAllBorder() {
    const layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (item.name.indexOf('border_') != -1) {
        item.visible = false
      }
    })
  }

  hotspotClick(name) {
    const layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (
        item.name.indexOf('border_') != -1 &&
        item.name !== 'border_' + name
      ) {
        item.visible = false
      }
    })

    if (this._options.hotspotClick) {
      this._options.hotspotClick(name)
    }
  }

  initVideo() {
    // addplugin是异步操作，不能马上获取到添加的plugin对象

    const checkPluginInit = () => {
      let videoPlugin = _krpano.plugin.getItem('video')
      if (videoPlugin) {
        videoPlugin.DefaultVideoOptions = DefaultVideoOptions
        videoPlugin.options = this._options
        videoPlugin._emitter = this._emitter
        videoPlugin.PlayerEvents = PlayerEvents
        // videoPlugin.events = this._options.events
        videoPlugin.videourl = this._options.url
        videoPlugin.videoId = this._options.videoId
        // videoPlugin.url = './plugins/videoplayer.js'
        videoPlugin.url = './plugins/videoplayer_basic_source.js'
        console.log('url===', this._options.url)
      } else {
        setTimeout(checkPluginInit, 0)
      }
    }
    checkPluginInit()
  }

  setVideoSrc() {
    _krpano.plugin.getItem('video').videourl = this._options.url
  }

  changeVideo(url) {
    _krpano.plugin.getItem('video').togglevideo(url)
  }

  /**
   * 设置初始视角
   * @param {String} info view字符串对象
   * @returns {Object}
   */
  setInitialView(info = null) {
    let view = _krpano.view

    if (info) {
      const { hlookat, vlookat, fov } = JSON.parse(info)
      view.hlookat = hlookat
      view.vlookat = vlookat
      view.fov = fov
    }
    return {
      hlookat: view.hlookat,
      vlookat: view.vlookat,
      fov: view.fov,
    }
  }

  play() {
    _krpano.plugin.getItem('video').play()
  }

  pause() {
    _krpano.plugin.getItem('video').pause()
  }

  /**
   * 添加互动组件
   * @param {*} info 参考互动组件JSON.json
   */
  addComponent(info) {
    console.log('addComponent==', info)
    if (info.baseSetting.type == 'Interactive') {
      info.interactiveGroup.map((group) => {
        const hotSpot = this.getHotspot(group.id)
        console.log(hotSpot)
        // 修改组件属性
        if (hotSpot) {
          if (info.baseSetting.name == '文本') {
            this.setTextComp(
              group.id,
              info.baseSetting.angleFollow ? 'layer' : 'hotspot',
              group.styleSetting,
              group.textSetting,
              group.transform2DSetting
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
              group.transform2DSetting
            )
          }
        } else {
          console.log('添加组件', group.id)
          this.addInteractiveHotspot(
            group.id,
            info.baseSetting.name,
            info.baseSetting.angleFollow ? 'layer' : 'hotspot',
            group.styleSetting,
            group.textSetting,
            group.transform2DSetting
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
   * @param {Object} transform2DSetting 组件变换信息
   */
  addInteractiveHotspot(
    name = 'a' + Math.random(),
    compName = 'PointClickModule',
    type = 'hotspot',
    styleSetting = null,
    textSetting = null,
    transform2DSetting = null
  ) {
    if (compName == 'TextModule') {
      this.addTextComp(
        name,
        type,
        styleSetting,
        textSetting,
        transform2DSetting
      )
    } else if (compName == 'PointClickModule') {
      this.addOptionBranchComp(
        name,
        type,
        styleSetting,
        textSetting,
        transform2DSetting
      )
    } else if (compName == 'ClickGroupModule') {
      this.addOptionBranchComp(
        name,
        type,
        styleSetting,
        textSetting,
        transform2DSetting
      )
    } else if (compName == 'ContinueClickModule') {
      this.addOptionBranchComp(
        name,
        type,
        styleSetting,
        textSetting,
        transform2DSetting
      )
    }

    return {
      name: name,
      tooltipname: 'tooltip_' + name,
      bordername: 'border_' + name,
    }
  }

  /**
   * 检查是否已经加载
   * 注意：krpano添加热点等一些方法是异步行为，添加后无法立即获取
   * @param {String} name 热点名
   * @param {String} type 热点类型
   */
  checkHasLoaded(name, type = 'hotspot') {
    return new Promise((resolve, reject) => {
      let count = 0
      let isLoaded = () => {
        let obj =
          type == 'hotspot'
            ? _krpano.hotspot.getItem(name)
            : _krpano.layer.getItem(name)
        if (obj) {
          resolve(name)
        } else {
          if (count >= 10) {
            reject('checkHasLoaded error please check whether the name exists!')
          }
          count++
          setTimeout(isLoaded, 200)
        }
      }

      isLoaded()
    })
  }

  /**
   * 添加文字热点
   */
  addTextComp(name, type, styleSetting, textSetting, transform2DSetting) {
    if (type == 'hotspot') {
      krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].type,text);
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].edge,center);
        set(hotspot[${name}].bg,false);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,true);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        set(hotspot[${name}].onloaded,add_all_the_time_border);
        `
      )
    } else {
      // 注意layer的scale需要加到css上
      krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].type,text);
        set(layer[${name}].keep,true);
        set(layer[${name}].zoom,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].bg,false);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].autowidth,auto);
        set(layer[${name}].autoheight,auto);
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        set(layer[${name}].onloaded,add_all_the_time_border);
        `
      )
    }
    this.setTextComp(name, type, styleSetting, textSetting, transform2DSetting)
  }

  /**
   * 添加选项分支组件
   */
  addOptionBranchComp(
    name,
    type,
    styleSetting,
    textSetting,
    transform2DSetting,
    compName
  ) {
    if (type == 'hotspot') {
      krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].type,image);
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].edge,center);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,true);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        set(hotspot[${name}].onloaded,add_all_the_time_tooltip);
        `
      )
    } else {
      // 注意layer的scale需要加到css上
      krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].type,image);
        set(layer[${name}].keep,true);
        set(layer[${name}].zoom,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        set(layer[${name}].onloaded,add_all_the_time_tooltip);
        `
      )
    }
    this.setOptionBranchComp(
      name,
      type,
      styleSetting,
      textSetting,
      transform2DSetting
    )
  }

  /**
   * 设置文本组件属性值
   */
  setTextComp(name, type, styleSetting, textSetting, transform2DSetting) {
    // 后面如果需要设置别的再加
    //   let css = {
    //     // align: textSetting.align,
    //     color: textSetting.fill,
    //     'font-size': textSetting.fontSize + 'px',
    //     // 'font-family': textSetting.fontFamily,
    //     // 'font-style': textSetting.fontStyle,
    //     // 'text-decoration': textSetting.textDecoration,
    //     scale: transform2DSetting?.scaleX || 1,
    //   };
    //   params.css = css;
    // }

    if (type == 'hotspot') {
      krpano.call(
        `
        set(hotspot[${name}].ath,${transform2DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform2DSetting?.y || 0});
        set(hotspot[${name}].depth,${transform2DSetting?.z || 200});
        set(hotspot[${name}].rx,${transform2DSetting?.rotationX || 0});
        set(hotspot[${name}].ry,${transform2DSetting?.rotationY || 0});
        set(hotspot[${name}].rz,${transform2DSetting?.rotationZ || 0});
        set(hotspot[${name}].scale,${transform2DSetting?.scale || 1});
        set(hotspot[${name}].html,${textSetting?.text || '默认文本'});
        set(hotspot[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;");
        `
      )
    } else {
      krpano.call(
        `
        set(layer[${name}].x,${
          transform2DSetting?.x ? transform2DSetting?.x + '%' : '50%'
        });
        set(layer[${name}].y,${
          transform2DSetting?.y ? transform2DSetting?.y + '%' : '50%'
        });
        set(layer[${name}].rotate,${transform2DSetting?.rotation || 0});
        set(layer[${name}].html,${textSetting?.text || '默认文本'});
        set(layer[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;scale:${
          transform2DSetting?.scaleX || 1
        }");
        `
      )
    }
  }

  setOptionBranchComp(
    name,
    type,
    styleSetting,
    textSetting,
    transform2DSetting
  ) {
    if (type == 'hotspot') {
      krpano.call(
        `
        set(hotspot[${name}].ath,${transform2DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform2DSetting?.y || 0});
        set(hotspot[${name}].depth,${transform2DSetting?.z || 800});
        set(hotspot[${name}].width,${transform2DSetting?.width || '100'});
        set(hotspot[${name}].height,${transform2DSetting?.height || '100'});
        set(hotspot[${name}].rx,${transform2DSetting?.rotationX || 0});
        set(hotspot[${name}].ry,${transform2DSetting?.rotationY || 0});
        set(hotspot[${name}].rz,${transform2DSetting?.rotationZ || 0});
        set(hotspot[${name}].scale,${transform2DSetting?.scale || 1});
        set(hotspot[${name}].url,${
          styleSetting?.styleEffect.beforeTrigger.previewPath ||
          InteractiveEnums[materialName].beforeTrigger
        });
       set(hotspot[${name}].beforeTrigger,${
          styleSetting?.styleEffect.beforeTrigger.previewPath ||
          InteractiveEnums[materialName].beforeTrigger
        });
       set(hotspot[${name}].triggering,${
          styleSetting?.styleEffect.triggering.previewPath ||
          InteractiveEnums[materialName].triggering
        });
        set(hotspot[${name}].text,${textSetting?.text || '默认文本'});
        set(hotspot[${name}].html,${textSetting?.text || '默认文本'});
        set(hotspot[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;");
        `
      )
    } else {
      krpano.call(
        `
        set(layer[${name}].x,${
          transform2DSetting?.x ? transform2DSetting?.x + '%' : '50%'
        });
        set(layer[${name}].y,${
          transform2DSetting?.y ? transform2DSetting?.y + '%' : '50%'
        });
        set(layer[${name}].width,${transform2DSetting?.width || '100'});
        set(layer[${name}].height,${transform2DSetting?.height || '100'});
        set(layer[${name}].rotate,${transform2DSetting?.rotation || 0});
        set(layer[${name}].url,${
          styleSetting?.styleEffect.beforeTrigger.previewPath ||
          InteractiveEnums[materialName].beforeTrigger
        });
        set(layer[${name}].beforeTrigger,${
          styleSetting?.styleEffect.beforeTrigger.previewPath ||
          InteractiveEnums[materialName].beforeTrigger
        });
         set(layer[${name}].triggering,${
          styleSetting?.styleEffect.triggering.previewPath ||
          InteractiveEnums[materialName].triggering
        });
        set(layer[${name}].text,${textSetting?.text || '默认文本'});
        set(layer[${name}].html,${textSetting?.text || '默认文本'});
        set(layer[${name}].css,"color:${
          textSetting?.fill || '0xffffff'
        };font-size:${textSetting?.fontSize || 16}px;scale:${
          transform2DSetting?.scaleX || 1
        }");
        `
      )
    }
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
   * 批量显示热点
   * @param {Array} names
   */
  showHotspot(names = []) {
    let hots = _krpano.hotspot.getArray()
    hots.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true
      } else {
        item.visible = false
      }
    })

    let layers = _krpano.layer.getArray()
    layers.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true
      } else {
        item.visible = false
      }
    })
  }

  // 隐藏全部选择框
  hideAllBorderSelect() {
    let layers = _krpano.layer.getArray()
    layers.map((item) => {
      item.visible = false
    })
  }

  toggleHotspot(name, isShow = false) {
    let hot = _krpano.hotspot.getItem(name)
    let layer = _krpano.layer.getItem(name)
    hot && (hot.visible = isShow)
    layer && (layer.visible = isShow)
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

  updatetime(time) {
    let ispaused = _krpano.plugin.getItem('video').ispaused
    let id = _krpano.plugin.getItem('video').videoId
    let interactNodeId = playList.getVideoParam(id)?.interactNodeId
    let list = playList.getVidioInteract(interactNodeId)
    let factorList = playList.getFactorList()
    list.forEach((item) => {
      let interactInfoId = item.interactInfoId
      let startTime = item.startTime
      let duration = item.duration
      let playState = item.playState
      let endState = item.endState
      let visible_item = true // 显隐
      let showConditionList = item.showConditionList
      showConditionList.forEach((item) => {
        let value = factorList.find((val) => val.key == item.key)?.value
        if (!eval(value + item.operator + item.temp)) {
          visible_item = false
        }
      })
      if (visible_item) {
        if (time >= startTime && time < duration) {
          visible_item = true
          // if(playState == 'pause'){
          //   _krpano.plugin.getItem('video').pause()
          // } else {
          //   _krpano.plugin.getItem('video').play()
          // }
        } else if (time >= duration) {
          if (endState == 'hide') {
            visible_item = false
          }
        } else {
          visible_item = false
        }
      }
      let interactInfoIdItem = playList
        .getInteractInfoList()
        .find((val) => val.interactInfoId == item.interactInfoId)
      if (interactInfoIdItem.interactInfo.type == 'TextModule') {
        _krpano.call(
          `set(layer[${interactInfoIdItem.interactInfoId}].visible, ${visible_item});`
        )
      } else if (interactInfoIdItem.interactInfo.type == 'PointClickModule') {
        let hotspot_list = _krpano.hotspot.getArray()
        hotspot_list.forEach((item) => {
          _krpano.call(`set(hotspot[${item.name}].visible, ${visible_item});`)
        })
      }
    })
  }
}

export default KPlayer
