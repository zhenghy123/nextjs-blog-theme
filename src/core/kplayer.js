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
        setTimeout(() => {
          checkPluginInit()
        }, 0)
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
    if (info.baseSetting.type == 'Interactive') {
      // 互动组件
      // if (info.baseSetting.interactiveType == 'OneClick') {
      // 单击组件添加
      info.interactiveGroup.map((group) => {
        const hotSpot = this.getHotspot(group.id)
        console.log(hotSpot)
        if (hotSpot) {
          if (info.baseSetting.angleFollow == 'layer') {
            this.setHotspot(group.id, group.styleSetting, 'layer')
          } else {
            this.setHotspot(group.id, group.styleSetting, 'layer')
          }
        } else {
          console.log('添加组件', group.id)
          // TODO:多坐标组件需要在添加前计算好坐标，具体坐标计算方法会提供
          this.addInteractiveHotspot(
            group.id,
            true,
            info.baseSetting.name,
            info.baseSetting.angleFollow ? 'layer' : 'hotspot',
            group.styleSetting,
            group.textSetting,
            group.transform2DSetting
          )
        }
      })
      // }
    } else if (info.baseSetting.type == 'Image') {
      // 图片
    } else if (info.baseSetting.type == 'Text') {
      // 文本
    }
  }

  /**
   * 添加互动组件热点（会绑定title plugin,border plugin）
   * @param {String} name 热点名（唯一标识，不能以数字开头哦）
   * @param {String} text 热点文字
   * @param {Boolean} distorted 畸变（设置后才能进行3D旋转） TODO:hotspot类型热点先写死true，是否需要此字段待定
   * @param {String} compName 组件类型名（如单击）
   * @param {String} type 热点类型（hotspot,layer）
   * @param {Object} styleSetting 组件背景信息
   * @param {Object} textSetting 组件文本信息
   * @param {Object} transform2DSetting 组件变换信息
   */
  addInteractiveHotspot(
    name = 'a' + Math.random(),
    distorted = true,
    materialName = 'PointClickModule',
    type = 'hotspot',
    styleSetting = null,
    textSetting = null,
    transform2DSetting = null
  ) {
    if (type == 'hotspot') {
      _krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,${distorted});
        set(hotspot[${name}].ath,${transform2DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform2DSetting?.y || 0});
        set(hotspot[${name}].width,${transform2DSetting?.width || '100'});
        set(hotspot[${name}].height,${transform2DSetting?.height || '100'});
        set(hotspot[${name}].scale,${transform2DSetting?.scaleX || 1});
        set(hotspot[${name}].rotate,${transform2DSetting?.rotate || 0});
        set(hotspot[${name}].alpha,${transform2DSetting?.opacity || 1});
        set(hotspot[${name}].rx,${transform2DSetting?.rotateX || 0});
        set(hotspot[${name}].ry,${transform2DSetting?.rotateY || 0});
        set(hotspot[${name}].rz,${transform2DSetting?.rotateZ || 0});
        set(hotspot[${name}].text,${textSetting?.text || '默认文本'});
        set(hotspot[${name}].url,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[materialName].beforeTrigger
        });
        set(hotspot[${name}].beforeTrigger,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[materialName].beforeTrigger
        });
        set(hotspot[${name}].triggering,${
          styleSetting?.triggering || InteractiveEnums[materialName].triggering
        });
        set(hotspot[${name}].afterTrigger,${
          styleSetting?.afterTrigger ||
          InteractiveEnums[materialName].afterTrigger
        });
        set(hotspot[${name}].onloaded,add_all_the_time_tooltip);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        `
      )
      if (styleSetting.action.actionType == 'SWITCHVIDEO') {
        _krpano.call(
          `set(hotspot[${name}].onclick, videointerface_play(${styleSetting.action.nextVideo}));`
        )
      } else if (styleSetting.action.actionType == 'JUMPTIME') {
        _krpano.call(
          `set(hotspot[${name}].onclick, skin_video_updatetime(${styleSetting.action.jumpTime}));`
        )
      }
    } else {
      // set(layer[${name}].x,${transform2DSetting?.x ||110});
      // set(layer[${name}].y,${transform2DSetting?.y ||110});
      _krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].keep,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].x,${transform2DSetting?.x || 110});
        set(layer[${name}].y,${transform2DSetting?.y || 110});
        set(layer[${name}].width,${transform2DSetting?.width || '100'});
        set(layer[${name}].height,${transform2DSetting?.height || '100'});
        set(layer[${name}].scale,${transform2DSetting?.scaleX || 1});
        set(layer[${name}].rotate,${transform2DSetting?.rotate || 0});
        set(layer[${name}].alpha,${transform2DSetting?.opacity || 1});
        set(layer[${name}].rx,${transform2DSetting?.rotateX || 0});
        set(layer[${name}].ry,${transform2DSetting?.rotateY || 0});
        set(layer[${name}].rz,${transform2DSetting?.rotateZ || 0});
        set(layer[${name}].text,${textSetting?.text || '默认文本'});
        set(layer[${name}].url,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[materialName].beforeTrigger
        });
        set(layer[${name}].beforeTrigger,${
          styleSetting?.beforeTrigger ||
          InteractiveEnums[materialName].beforeTrigger
        });
        set(layer[${name}].triggering,${
          styleSetting?.triggering || InteractiveEnums[materialName].triggering
        });
        set(layer[${name}].afterTrigger,${
          styleSetting?.afterTrigger ||
          InteractiveEnums[materialName].afterTrigger
        });
        set(layer[${name}].onloaded,add_all_the_time_tooltip);
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        `
      )
    }

    // 判断热点 tooltip plugin 是否成功加载
    let tootipObj = null
    const checkHasOnloaded = () => {
      if (type == 'hotspot') {
        tootipObj = _krpano.hotspot.getItem(name)
      } else {
        tootipObj = _krpano.plugin.getItem('tooltip_' + name)
      }
      if (!tootipObj) {
        setTimeout(() => {
          checkHasOnloaded()
        }, 200)
      } else {
        // 设置tooltip文本样式
        if (textSetting) {
          // TODO:貌似中划线才能识别
          let obj = {
            align: textSetting.align,
            color: textSetting.fill,
            'font-size': textSetting.fontSize + 'px',
            'font-family': textSetting.fontFamily,
            'font-style': textSetting.fontStyle,
            'text-decoration': textSetting.textDecoration,
          }

          if (type == 'hotspot') {
            this.setHotspot(name, obj, 'hotspot')
          } else {
            this.setHotspot(name, { css: obj }, 'tooltip')
          }
        }
      }
    }
    checkHasOnloaded()

    return {
      name: name,
      tooltipname: 'tooltip_' + name,
      bordername: 'border_' + name,
    }
  }

  /**
   * 添加热点(跟随视角)
   * 注意：为确保位置统一，layer使用相对位置% --拖动action需特殊处理
   * @param {String} name 热点名（唯一标识，不能以数字开头哦）
   * @param {String} moduleType 互动组件类型，参考player-interactives
   * @param {Object} styleSetting 组件背景信息
   * @param {Object} textSetting 组件文本信息
   * @param {Object} transform2DSetting 组件变换信息
   */
  addLayer({
    name,
    type,
    styleSetting = null,
    textSetting = null,
    transform2DSetting = null,
  }) {
    if (!name) {
      throw new Error('addLayer params of name can not empty!')
    }

    if (!type) {
      throw new Error('addLayer params of type can not empty!')
    }

    _krpano.call(
      `
      addlayer(${name});
      set(layer[${name}].keep,true);
      set(layer[${name}].edge,center);
      set(layer[${name}].flag,'layer');
      set(layer[${name}].x,${transform2DSetting?.x || '50%'});
      set(layer[${name}].y,${transform2DSetting?.y || '50%'});
      set(layer[${name}].width,${transform2DSetting?.width || '100'});
      set(layer[${name}].height,${transform2DSetting?.height || '100'});
      set(layer[${name}].scale,${transform2DSetting?.scaleX || 1});
      set(layer[${name}].rotate,${transform2DSetting?.rotate || 0});
      set(layer[${name}].alpha,${transform2DSetting?.opacity || 1});
      set(layer[${name}].text,${textSetting?.text || '默认文本'});
      set(layer[${name}].url,${
        styleSetting?.beforeTrigger ||
        InteractiveEnums[materialName].beforeTrigger
      });
      set(layer[${name}].beforeTrigger,${
        styleSetting?.beforeTrigger ||
        InteractiveEnums[materialName].beforeTrigger
      });
      set(layer[${name}].triggering,${
        styleSetting?.triggering || InteractiveEnums[materialName].triggering
      });
      set(layer[${name}].afterTrigger,${
        styleSetting?.afterTrigger ||
        InteractiveEnums[materialName].afterTrigger
      });
      set(layer[${name}].onloaded,add_all_the_time_tooltip);
      set(layer[${name}].ondown,ondownfn);
      set(layer[${name}].onup,onupfn);
      `
    )
  }

  /**
   * 添加热点(空间位置)
   * 注意：hotspot使用的是球面坐标+depth，如需转换三维坐标需要调用spheretospace
   * @param {String} name 热点名（唯一标识，不能以数字开头哦）
   * @param {String} moduleType 互动组件类型，参考player-interactives
   * @param {Object} styleSetting 组件背景信息
   * @param {Object} textSetting 组件文本信息
   * @param {Object} transform2DSetting 组件变换信息
   */
  addHotspot({
    name,
    type,
    styleSetting = null,
    textSetting = null,
    transform2DSetting = null,
  }) {}

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

  // setHotspot(){}

  /**
   * 修改热点信息
   * 注意：layer的文字信息修改是tooltip_`name`
   * @param {String} name 热点名
   * @param {Object} info 修改信息对象
   */
  setLayer(name, info) {
    let tooltip = _krpano.plugin.getItem('tooltip_' + name)
    Object.keys(info).map((item) => {
      // 修改style样式
      if (item == 'css') {
        let cssObj = info.css
        let cssStyle = tooltip.css.split(';')

        Object.keys(cssObj).map((citem) => {
          // 样式需要转换成中划线的形式
          let citemML = this.toMiddleLine(citem)
          cssStyle.map((citem, index) => {
            if (citem.indexOf(citemML) != -1) {
              cssStyle.splice(index, 1)
            }
          })
          cssStyle.push(`${citemML}:${cssObj[citem]}`)
        })

        tooltip.css = cssStyle.join(';')
      } else {
        // 修改layer本身
        tooltip[item] = info[item]
      }
    })
    return obj
  }

  /**
   * 添加文本热点
   */
  addImageHotspot() {}

  /**
   * 添加文字热点
   */
  addTextHotspot() {}

  /**
   * 添加视频热点
   */
  addVideoHotspot() {}

  /**
   * 修改热点
   * @param {String} name 热点名
   * @param {Object} keyvalue 热点属性key:value
   * @param {String} type hotspot|tooltip
   */
  setHotspot(name, keyvalue, type = 'hotspot') {
    if (type == 'hotspot') {
      let obj = _krpano.hotspot.getItem(name)
      Object.keys(keyvalue).map((item) => {
        // console.log(item, keyvalue[item]);
        obj[item] = keyvalue[item]
      })
      return obj
    } else {
      let obj = _krpano.plugin.getItem('tooltip_' + name)
      Object.keys(keyvalue).map((item) => {
        if (item == 'css') {
          let kvs = keyvalue[item]
          let cssStyle = obj.css.split(';')

          Object.keys(kvs).map((kvitem) => {
            let middlekvitem = this.toMiddleLine(kvitem)
            cssStyle.map((citem, index) => {
              if (citem.indexOf(middlekvitem) != -1) {
                cssStyle.splice(index, 1)
              }
            })
            cssStyle.push(`${middlekvitem}:${kvs[kvitem]}`)
          })

          obj.css = cssStyle.join(';')
        } else {
          obj[item] = keyvalue[item]
        }
      })
      return obj
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
    // if (type == 'hotspot') {
    // } else {
    //   return _krpano.layer.getItem(name);
    // }
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

export default KPlayer
