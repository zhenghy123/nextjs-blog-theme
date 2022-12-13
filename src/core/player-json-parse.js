import { PlayerEvents } from './player-events'
import { PlayerControl } from './player-control'
import { PlayerTree } from './player-json-tree'
import { VideoType } from './player-interactives'

import {
  createVideo,
  addVideoListener,
  createAudio,
  createImage,
} from './player-media-utils'

export class PlayerParse {
  constructor(url, _player, type = 'gb') {
    this._url = url // json地址
    this._vrType = VideoType.VR
    this._player = _player
    this._playerControl = new PlayerControl(_player, this)
    this._playerTree = new PlayerTree(this, _player)

    this._json = {}
    this._videoPrefix = url.replace('index.json', '') // 视频文件前缀
    // this._assetsPrefix = replace(/sim.*\/index.json/, '').replace(
    //   /video\/index.json/,
    //   ''
    // ) // 资源文件(图片、音频、config)前缀
    this._assetsPrefix =
      url.substring(
        0,
        url.substring(0, url.lastIndexOf('/') - 1).lastIndexOf('/')
      ) + '/' // 资源文件(图片、音频、config)前缀
    this._compNames = [] // 全部互动组件
    this._factorList = [] // 互动因子
    this._firstVideoId = ''
    this._hasLoad = false // 是否处理完json数据
    this._canvasHeight = 0
    this._canvasWidth = 0
    this._kplayerScale = 1 // 屏幕与设定屏幕比率
    this._kplayerScaleInverse = 1 // 屏幕与设定屏幕比率倒数
    // gb 国标  cp 自定义大json
    if (type == 'cp') {
      this.initSelf()
    } else {
      this.init()
    }
  }

  /**
   * 服务器文件存放目录结构：
   * - assets
   *    - img1.png
   *    - img2.png
   * -video
   *    - index.json
   *    - video1.mp4
   *    - video2.mp4
   * - config1.json
   * - config2.json
   */
  init() {
    /**
     * 初始化数据顺序：
     * - 获取index.json
     * - 获取config.json
     * - 拼接config到infoItem,拼接infoItem到nodeItem
     * - 层级结构处理结束
     */
    this.fetchJson(this._url).then((json) => {
      this._json = json
      this._factorList = json.factorList
      this._firstVideoId = json.drama.firstVideoId
      let firstItem = this.getVideoItem(this._firstVideoId)
      this._canvasHeight = firstItem?.canvasHeight || 1920
      this._canvasWidth = firstItem?.canvasWidth || 1080
      let container = this._player._options.id
      let nodetreeSize = document
        .getElementById(container)
        ?.getBoundingClientRect()
      this._kplayerScale = nodetreeSize.width / this._canvasWidth || 1
      this._kplayerScaleInverse = this._canvasWidth / nodetreeSize.width || 1
      this._vrType = firstItem?.playType

      json.videoList.map((item) => {
        // 拼接处理视频地址和封面地址
        item.previewThumbnial = item.thumbnail
          ? this._assetsPrefix + item.thumbnail.replace('../', '')
          : ''
        item.previewVideoPath = this._videoPrefix + item.videoPath
        // 初始化视频对象
        item.video = createVideo(
          item.previewVideoPath,
          item.videoId,
          item.previewThumbnial
        )
        addVideoListener(item.video, this._player._emitter)
      })

      // 获取互动组件配置config.json
      this.fetchInteractConfig()
    })
  }

  /**
   * 后端帮忙处理后的json解析
   * TODO: 后续自己写方法进行转换
   */
  async initSelf() {
    this.fetchJson(this._url).then((json) => {
      json = JSON.parse(json)
      console.error('json==', json)
      this._json = json
      this._factorList = json.factorList
      this._firstVideoId = json.drama.firstVideoId
      let firstItem = this.getVideoItem(this._firstVideoId)
      this._canvasHeight = firstItem?.canvasHeight || 1920
      this._canvasWidth = firstItem?.canvasWidth || 1080
      let container = this._player._options.id
      let nodetreeSize = document
        .getElementById(container)
        ?.getBoundingClientRect()
      this._kplayerScale = nodetreeSize.width / this._canvasWidth || 1
      this._kplayerScaleInverse = this._canvasWidth / nodetreeSize.width || 1
      this._vrType = firstItem?.playType
      json.videoList.map((item) => {
        // 拼接处理视频地址和封面地址
        item.previewThumbnial = item.thumbnail
        item.previewVideoPath = item.videoPath
        // 初始化视频对象
        item.video = createVideo(
          item.previewVideoPath,
          item.videoId,
          item.previewThumbnial
        )
        addVideoListener(item.video, this._player._emitter)
      })

      // 处理互动组件内图片、音频
      let dealUrl = (arr) => {
        arr.map((item) => {
          const { imgs, btns } =
            item.interactInfoIdJson?.interactConfigJson ||
            item.interactConfigJson
          // metas 是文本信息，没有图片

          // 处理图片等地址 TODO:imgs暂时没用到
          if (imgs) {
            let keys = Object.keys(imgs)
            keys.map((key) => {
              imgs['preview' + key] = key
            })
          }

          // 互动组件按钮配置
          if (btns) {
            btns.map((btn) => {
              // audio是按钮点击音效，在按钮点击时触发
              if (btn.audio) {
                btn.previewAudio = btn.audio
                btn.audioContext = createAudio(btn.previewAudio)
              }
              // 按钮点击前、中、后背景图
              if (btn.backgroundImageAfterClick) {
                btn.previewBackgroundImageAfterClick =
                  btn.backgroundImageAfterClick
                createImage(btn.previewBackgroundImageAfterClick)
              }
              if (btn.backgroundImageBeforeClick) {
                btn.previewBackgroundImageBeforeClick =
                  btn.backgroundImageBeforeClick
                createImage(btn.previewBackgroundImageBeforeClick)
              }
              if (btn.backgroundImageClick) {
                btn.previewBackgroundImageClick = btn.backgroundImageClick
                createImage(btn.previewBackgroundImageClick)
              }

              // TODO:点击组合按钮点击记录效果(点击后有个选中效果，再次点击去除选中)
            })
          }
        })
      }
      dealUrl(json.interactNodeList)
      dealUrl(json.interactInfoList)
      this.addSceneSource()
    })
  }

  /**
   * 获取互动组件配置config.json
   */
  fetchInteractConfig() {
    const interactInfoList = this._json.interactInfoList

    let count = 0
    interactInfoList.map((item) => {
      let url = this._assetsPrefix + item.interactConfig
      this.fetchJson(url).then((json) => {
        count++
        item.interactConfigJson = json

        // metas 是文本信息，没有图片

        // 处理图片等地址 TODO:imgs暂时没用到
        if (json.imgs) {
          let keys = Object.keys(json.imgs)
          keys.map((key) => {
            json.imgs['preview' + key] =
              this._assetsPrefix + key.replace('../', '')
          })
        }

        // 互动组件按钮配置
        if (json.btns) {
          json.btns.map((btn) => {
            // audio是按钮点击音效，在按钮点击时触发
            if (btn.audio) {
              btn.previewAudio =
                this._assetsPrefix + btn.audio.replace('../', '')
              btn.audioContext = createAudio(btn.previewAudio)
            }
            // 按钮点击前、中、后背景图
            if (btn.backgroundImageAfterClick) {
              btn.previewBackgroundImageAfterClick =
                this._assetsPrefix +
                btn.backgroundImageAfterClick.replace('../', '')
              createImage(btn.previewBackgroundImageAfterClick)
            }
            if (btn.backgroundImageBeforeClick) {
              btn.previewBackgroundImageBeforeClick =
                this._assetsPrefix +
                btn.backgroundImageBeforeClick.replace('../', '')
              createImage(btn.previewBackgroundImageBeforeClick)
            }
            if (btn.backgroundImageClick) {
              btn.previewBackgroundImageClick =
                this._assetsPrefix + btn.backgroundImageClick.replace('../', '')
              createImage(btn.previewBackgroundImageClick)
            }

            // TODO:点击组合按钮点击记录效果(点击后有个选中效果，再次点击去除选中)
          })
        }

        // 请求完最后一个config.json，开始拼接互动组件Info配置进interactNodeList
        if (count == interactInfoList.length) {
          this.concatInfoToInteractNodeList()
        }
      })
    })

    if (interactInfoList.length == 0) {
      this.addSceneSource()
    }
  }

  addSceneSource() {
    // 初始化场景
    // 至此已处理完互动组件节点（node）、信息（info）、配置(config)，并按层级结构拼接进interactNodeList
    // 一次性全部添加热点，后续根据videoId、组件配置进行显隐

    this._hasLoad = true
    this._player.initVideo(this._vrType)

    this.addAllHotspot()
    this._playerControl.initFirstVideo()
    this._playerTree.init()

    console.log(this._json)
  }
  /**
   * 拼接互动组件Info配置进interactNodeList
   */
  concatInfoToInteractNodeList() {
    const interactNodeList = this._json.interactNodeList
    interactNodeList.map((item) => {
      item.interactInfoIdJson = this._json.interactInfoList.find(
        (info) => info.interactInfoId == item.interactInfoId
      )
    })

    this.addSceneSource()
  }

  /**
   * 请求json
   * @param {String} url
   * @returns Promise<json>
   */
  async fetchJson(url) {
    const response = await fetch(url)
    return await response.json()
  }

  /**
   * 获取互动因子
   * @returns
   */
  get_factorList() {
    return this._factorList
  }

  /**
   * 设置互动因子
   * @param {*互动因子计算} arr
   */
  set_factorList(arr) {
    this._factorList.map((item) => {
      let arrItem = arr.find((val) => val.key == item.key)
      if (arrItem && item) {
        item.value = eval(item.value + arrItem.operator + arrItem.temp)
      }
    })
  }

  /**
   * 获取视频列表
   */
  getPlayList() {
    return this._json?.videoList
  }

  /**
   * 获取节点列表
   */
  getInteractNodeList() {
    return this._json?.interactNodeList
  }

  /**
   * 获取节点信息列表
   */
  getInteractInfoList() {
    return this._json?.interactInfoList
  }

  /**
   * 根据videoId获取视频配置对象
   * @param {String} videoId
   * @returns videoItem
   */
  getVideoItem(videoId) {
    return this._json.videoList.find((item) => item.videoId == videoId)
  }

  /**
   * 根据interactNodeId获取互动节点配置
   * @param {String} interactNodeId
   * @returns nodeItem
   */
  getNodeItem(interactNodeId) {
    let nodeIttem = this._json.interactNodeList.find(
      (item) => item.interactNodeId == interactNodeId
    )
    return nodeIttem
  }

  /**
   * 获取当前视频对象的互动组件信息（可能有多个）
   * @param {String} videoId
   * @returns Array<nodeItem>
   */
  getVideoNodeConfig(videoId) {
    let videoItem = this.getVideoItem(videoId)
    let list = []
    let ids = videoItem.interactNodeId // videoItem.interactNodeId.split(',')
    ids.map((id) => {
      let item = this.getNodeItem(id)
      list.push(item)
    })

    return list
  }

  /**
   * 根据视videoId,当前时间获取要显示的互动组件
   * @param {String} videoId
   * @param {Number} time
   * @returns Array<activeNodeItem>
   */
  getActivetNodeList(videoId, time) {
    let list = this.getVideoNodeConfig(videoId)
    let nodes = []
    list.map((item) => {
      if (item.startTime <= time && time <= item.startTime + item.duration) {
        nodes.push(item)
      }
    })
    return nodes
  }

  /**
   * 根据视videoId,当前时间获取要显示的互动组件的每一项id集合
   * 用于控制组件批量显示、隐藏
   * @param {String} videoId
   * @param {Number} time
   * @returns Array<id>
   */
  getActivetCompIds(videoId, time) {
    let list = this.getActivetNodeList(videoId, time)
    let ids = []
    list.map((item) => {
      const { btns, ctrls, imgs, metas } =
        item.interactInfoIdJson.interactConfigJson
      // 文本和互动组件不会同时存在（虽然展示的时候会）
      let comps = metas || btns
      if (comps) {
        comps.map((comp) => {
          ids.push(comp.id)
        })
      }
    })
    return { ids: ids, activeNodes: list }
  }

  /**
   * 根据视interactNodeId,获取每一项id集合
   */
  getInteractNodeIds(interactNodeId) {
    let param = this.getNodeItem(interactNodeId)
    let ids = []
    const { btns, metas } = param?.interactInfoIdJson?.interactConfigJson
    // 文本和互动组件不会同时存在（虽然展示的时候会）
    let comps = metas || btns
    if (comps) {
      comps.map((comp) => {
        ids.push(comp.id)
      })
    }
    return ids
  }
  /**
   * 一次性添加全部热点信息（默认隐藏）
   */
  addAllHotspot() {
    let _interactInfoIdJson = this._json.interactInfoList
    _interactInfoIdJson.map((item) => {
      let type = item.isFollowCamera ? 'layer' : 'hotspot'
      if (this._vrType != VideoType.VR) {
        type = 'layer'
      }
      let compType = item.interactInfo.type
      // let compId = 'a_' + Math.random()

      const { btns, ctrls, imgs, metas } = item.interactConfigJson

      let textSetting = null
      let styleSetting = null
      let transform3DSetting = null
      let filterSetting = null

      // 文本和互动组件不会同时存在（虽然展示的时候会）
      let comps = metas || btns
      if (comps) {
        comps.map((comp) => {
          let style = comp.style
          // 注意不能以数字开头，哪怕是字符串
          // TODO:数据造的有问题，先拼接使用
          let name = comp.id
          this._compNames.push(name)
          let size = 16
          if (this._vrType != VideoType.VR) {
            size = 20
          }
          textSetting = {
            text: comp.text,
            fontSize: style.fontSize || size,
            fill: style.color,
          }
          if (this._vrType != VideoType.VR && type == 'layer') {
            textSetting.fontSize = textSetting.fontSize * this._kplayerScale
          }

          // 非文字才会有 styleSetting,默认null
          if (btns) {
            styleSetting = {
              beforeTrigger: comp.previewBackgroundImageBeforeClick,
              triggering: comp.previewBackgroundImageClick,
              afterTrigger: comp.previewBackgroundImageAfterClick,
            }
            // layer没有xy 用宽高
            if (this._vrType != VideoType.VR && type == 'layer') {
              style.width = style.scaleX * style.width * this._kplayerScale
              style.height = style.scaleY * style.height * this._kplayerScale
              style.scale = 1
            } else {
              style.scale = style.scaleX * this._kplayerScale
            }
          }
          let position = {
            x: style.posX,
            y: style.posY,
            z: style.posZ,
          }
          if (this._vrType != VideoType.VR) {
            let x = (position.x / this._canvasWidth) * 100 || '0'
            let y = (position.y / this._canvasHeight) * 100 || '0'
            position = {
              x: x,
              y: y,
            }
          }
          transform3DSetting = {
            ...style,
            ...position,
          }
          filterSetting = {
            alpha: style.opacity || 0,
          }
          if (name) {
            this._player.addInteractiveHotspot(
              name,
              compType,
              type,
              styleSetting,
              textSetting,
              transform3DSetting,
              filterSetting
            )
          }
        })
      }
    })
  }

  /**
   * 根据组件热点id获取热点对象
   * @param {String} id
   * @returns interactConfigJson
   */
  getInteractConfigJsonItem(id) {
    let infoList = this.getInteractInfoList()
    let config = {}
    infoList.forEach((item) => {
      let btns = item.interactConfigJson.btns
      let configJson = btns?.find((param) => param.id == id)
      if (configJson) {
        config = item
      }
    })
    return config
  }

  setKplayerScaleInverse(scale, scaleInverse) {
    this._kplayerScale = scale
    this._kplayerScaleInverse = scaleInverse
  }
}
