//  视频事件常量
const VideoEvents = {
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
};

const InteractiveEnums = {
  单击: {
    beforeTrigger: './imgs/beforeTrigger.png',
    triggering: './imgs/triggering.png',
  },
};

// 视频参数设置
const VideoOptions = {
  crossorigin: 'anonymous',
  muted: true,
  volume: 1,
  poster: '',
  preload: 'auto',
  loop: false,
  autoplay: false,
  // playbackRate: 1,
  'webkit-playsinline': true,
  playsinline: 'playsinline',
  'x-webkit-airplay': true,
};

// 互动视频VR播放器
class KPlayer {
  constructor(options) {
    this._options = Object.assign(options, {
      videoOptions: { ...VideoOptions, ...options.videoOptions },
      events: options.events || {},
      // events: {
      //   loadstart: function () {},
      // },
      ispreview: false, // 是否预览模式
    });
    this._videoEvents = VideoEvents;
    this._events = {};

    this.init();
  }

  init() {
    this._plugin = krpano.plugin;
    this._actions = krpano.actions;
    this._layer = krpano.layer;
    this._hotspot = krpano.hotspot;

    this.initVideo();
    // console.error('_plugin===', this._plugin.getItem('video'));
    let that = this;

    krpano.global.ispreview = this._options.ispreview;
    Object.defineProperty(this._options, 'ispreview', {
      set(val) {
        // that._options.ispreview = val;
        krpano.global.ispreview = val;
        // 预览模式下去除选中框
        if (val) {
          let layers = krpano.layer.getArray();
          layers.map((item) => {
            if (item.name.indexOf('border_') != -1) {
              item.visible = false;
            }
          });
        }
      },
      get() {
        return that._options.ispreview;
      },
    });

    window.hotspotClick = this.hotspotClick.bind(this);
  }

  hotspotClick(name) {
    let layers = krpano.layer.getArray();
    layers.map((item) => {
      if (item.name.indexOf('border_') != -1 && item.name !== 'border_' + name) {
        item.visible = false;
      }
    });

    if (this._options.hotspotClick) {
      this._options.hotspotClick(name);
    }
  }

  initVideo() {
    // addplugin是异步操作，不能马上获取到添加的plugin对象

    const checkPluginInit = () => {
      let videoPlugin = this._plugin.getItem('video');
      if (videoPlugin) {
        videoPlugin.videoOptions = this._options.videoOptions;
        videoPlugin.VideoEvents = VideoEvents;
        videoPlugin.events = this._options.events;
        videoPlugin.videourl = this._options.url;
        videoPlugin.url = './plugins/videoplayer.js';
        // videoPlugin.url = './plugins/videoplayer_basic_source.js';
        console.log('url===', this._options.url);
      } else {
        setTimeout(() => {
          checkPluginInit();
        }, 0);
      }
    };
    checkPluginInit();
  }

  setVideoSrc() {
    this._plugin.getItem('video').videourl = this._options.url;
  }

  changeVideo(url) {
    this._plugin.getItem('video').togglevideo(url);
  }

  /**
   * 设置并返回场景主视角
   * 不传则返回视角信息
   */
  setMainFov(hlookat, vlookat, fov) {
    let view = krpano.view;
    if (hlookat && vlookat) {
      view.hlookat = hlookat;
      view.vlookat = vlookat;
      view.fov = fov || 90;
    }
    return {
      hlookat: view.hlookat,
      vlookat: view.vlookat,
      fov: view.fov,
    };
  }

  play() {
    this._plugin.getItem('video').play();
  }

  pause() {
    this._plugin.getItem('video').pause();
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
        const hotSpot = this.getHotspot(group.id);
        console.log(hotSpot);
        if (hotSpot) {
          if (info.baseSetting.angleFollow == 'layer') {
            this.setHotspot(group.id, group.styleSetting, 'layer');
          } else {
            this.setHotspot(group.id, group.styleSetting, 'layer');
          }
        } else {
          console.log('添加组件', group.id);
          // TODO:多坐标组件需要在添加前计算好坐标，具体坐标计算方法会提供
          this.addInteractiveHotspot(
            group.id,
            true,
            info.baseSetting.name,
            info.baseSetting.angleFollow ? 'layer' : 'hotspot',
            group.styleSetting,
            group.textSetting,
            group.transform2DSetting,
          );
        }
      });
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
    materialName = '单击',
    type = 'hotspot',
    styleSetting = null,
    textSetting = null,
    transform2DSetting = null,
  ) {
    if (type == 'hotspot') {
      krpano.call(
        `
        addhotspot(${name});
        set(hotspot[${name}].keep,true);
        set(hotspot[${name}].zoom,true);
        set(hotspot[${name}].flag,'hotspot');
        set(hotspot[${name}].distorted,${distorted});
        set(hotspot[${name}].ath,${transform2DSetting?.x || 0});
        set(hotspot[${name}].atv,${transform2DSetting?.y || 0});
        set(hotspot[${name}].width,${transform2DSetting?.width || 'prop'});
        set(hotspot[${name}].height,${transform2DSetting?.height || '100'});
        set(hotspot[${name}].scale,${transform2DSetting?.scaleX || 1});
        set(hotspot[${name}].rotate,${transform2DSetting?.rotation || 0});
        set(hotspot[${name}].text,${textSetting?.text || '默认文本'});
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
        set(hotspot[${name}].onloaded,add_all_the_time_tooltip);
        set(hotspot[${name}].ondown,ondownfn);
        set(hotspot[${name}].onup,onupfn);
        `,
      );
    } else {
      // set(layer[${name}].x,${transform2DSetting?.x ||110});
      // set(layer[${name}].y,${transform2DSetting?.y ||110});
      krpano.call(
        `
        addlayer(${name});
        set(layer[${name}].keep,true);
        set(layer[${name}].edge,center);
        set(layer[${name}].flag,'layer');
        set(layer[${name}].x,${transform2DSetting?.x || 110});
        set(layer[${name}].y,${transform2DSetting?.y || 110});
        set(layer[${name}].width,${transform2DSetting?.width || 'prop'});
        set(layer[${name}].height,${transform2DSetting?.height || '100'});
        set(layer[${name}].scale,${transform2DSetting?.scaleX || 1});
        set(layer[${name}].rotate,${transform2DSetting?.rotation || 0});
        set(layer[${name}].text,${textSetting?.text || '默认文本'});
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
        set(layer[${name}].onloaded,add_all_the_time_tooltip);
        set(layer[${name}].ondown,ondownfn);
        set(layer[${name}].onup,onupfn);
        `,
      );
    }

    // 判断热点 tooltip plugin 是否成功加载
    let tootipObj = null;
    const checkHasOnloaded = () => {
      tootipObj = this._plugin.getItem('tooltip_' + name);
      if (!tootipObj) {
        setTimeout(() => {
          checkHasOnloaded();
        }, 200);
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
          };

          this.setHotspot(name, { css: obj }, 'tooltip');
        }
      }
    };
    checkHasOnloaded();

    return { name: name, tooltipname: 'tooltip_' + name, bordername: 'border_' + name };
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
      let obj = krpano.hotspot.getItem(name);
      Object.keys(keyvalue).map((item) => {
        // console.log(item, keyvalue[item]);
        obj[item] = keyvalue[item];
      });
      return obj;
    } else {
      let obj = krpano.plugin.getItem('tooltip_' + name);
      Object.keys(keyvalue).map((item) => {
        if (item == 'css') {
          let kvs = keyvalue[item];
          let cssStyle = obj.css.split(';');

          Object.keys(kvs).map((kvitem) => {
            let middlekvitem = this.toMiddleLine(kvitem);
            cssStyle.map((citem, index) => {
              if (citem.indexOf(middlekvitem) != -1) {
                cssStyle.splice(index, 1);
              }
            });
            cssStyle.push(`${middlekvitem}:${kvs[kvitem]}`);
          });

          obj.css = cssStyle.join(';');
        } else {
          obj[item] = keyvalue[item];
        }
      });
      return obj;
    }
  }

  // 获取屏幕中心layer坐标
  getCenterLayerPos() {
    let id = krpano.embeddingsettings.id;
    let width = document.getElementById(id).offsetWidth;
    let height = document.getElementById(id).offsetHeight;
    return { x: width / 2, y: height / 2 };
  }

  // 获取屏幕中心hotspot坐标
  getCenterHotspotPos() {
    let obj = this.getCenterLayerPos();
    return this.screentosphere(obj.x, obj.y);
  }

  // ath atv to  x y
  spheretoscreen(ath, atv) {
    return krpano.spheretoscreen(ath, atv);
  }

  // x y to ath atv
  screentosphere(x, y) {
    return krpano.screentosphere(x, y);
  }

  // 下划线
  toMiddleLine(str) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  /**
   * 移出热点 TODO:具体移出何种类型的组件要根据标识去判断
   * @param {String} name
   */
  removeHotspot(name) {
    let hot = krpano.hotspot.getItem(name);
    let layer = krpano.layer.getItem(name);

    if (hot) {
      krpano.actions.removehotspot(name);
    } else if (layer) {
      krpano.actions.removelayer(name, true);
    }

    krpano.actions.removeplugin('tooltip_' + name);
    krpano.actions.removeplugin('border_' + name);
  }

  /**
   * 批量显示热点
   * @param {Array} names
   */
  showHotspot(names = []) {
    let hots = krpano.hotspot.getArray();
    hots.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true;
      } else {
        item.visible = false;
      }
    });

    let layers = krpano.layer.getArray();
    layers.map((item) => {
      if (names.includes(item.name)) {
        item.visible = true;
      } else {
        item.visible = false;
      }
    });
  }

  // 隐藏全部选择框
  hideAllBorderSelect() {
    let layers = krpano.layer.getArray();
    layers.map((item) => {
      item.visible = false;
    });
  }

  toggleHotspot(name, isShow = false) {
    let hot = krpano.hotspot.getItem(name);
    let layer = krpano.layer.getItem(name);
    hot && (hot.visible = isShow);
    layer && (layer.visible = isShow);
  }

  /**
   * 切换场景（视频、图片、黑屏）
   * 注意：热点和插件要设置 keep:true
   * @param {String} name
   */
  changeScene(name) {
    krpano.actions.loadscene(name);
    krpano.plugin.getItem(0).lastCurrentTime = Math.random();
    krpano.actions.updatescreen();
  }

  getPlugin(name) {
    return this._plugin.getItem(name);
  }

  getHotspot(name, type = 'hotspot') {
    return krpano.hotspot.getItem(name) || krpano.layer.getItem(name);
    // if (type == 'hotspot') {
    // } else {
    //   return krpano.layer.getItem(name);
    // }
  }

  /**
   * 销毁
   */
  destroy() {
    // video不删除
    while (krpano.plugin.count > 1) {
      krpano.plugin.removeItem(1);
    }

    // video不删除
    while (krpano.layer.count > 1) {
      krpano.hotspot.removeItem(1);
    }

    while (krpano.hotspot.count) {
      krpano.hotspot.removeItem(0);
    }

    // 假装销毁
    this.changeScene('noscene');

    // removepano('krpanoHTMLObject');
  }
}

window.KPlayer = KPlayer;
