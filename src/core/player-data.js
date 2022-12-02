class PlayerData {
  constructor(url) {
    this._url = url // json地址
    this._videoPrefix = '' // 文件前缀
    this._assetsPrefix = ''
    this._json = {}
    this._compNames = []
    this.jsonUrl = url
    this.factorList = []
    this.treeList = {} //树节点
    this.init()
  }

  init() {
    /**
     * 服务器文件存放目录结构：
     * - assets
     *    - img1.png
     *    - img2.png
     * -video
     *    - index.json
     *    - video1.mp4
     *    - video2.mp4
     *    - config1.json
     *    - config2.json
     */
    this._videoPrefix = this._url.replace('index.json', '')
    this._assetsPrefix = this._url.replace('video/index.json', '')

    this.fetchJson(this._url).then((json) => {
      this._json = json
      this.fetchInteractConfig()
    })
  }

  /**
   * 获取互动组件配置json
   */
  fetchInteractConfig() {
    const interactInfoList = this._json.interactInfoList
    let count = 0
    interactInfoList.map((item) => {
      let url = this._videoPrefix + item.interactConfig
      this.fetchJson(url).then((json) => {
        count++
        item.interactConfigJson = json

        // 请求完最后一个json开始拼接进interactInfoList
        if (count == interactInfoList.length) {
          this.concatJsonToInteractNodeList()
        }
      })
    })
  }

  concatJsonToInteractNodeList() {
    const interactNodeList = this._json.interactNodeList
    interactNodeList.map((item) => {
      item.interactInfoIdJson = this._json.interactInfoList.find(
        (info) => info.interactInfoId == item.interactInfoId
      )
    })

    this.addVideoHotspot(this._json.drama?.firstVideoId)
    this.setTreeList()
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

  getFirstVideoId() {
    return this._json.drama?.firstVideoId
  }

  getFactorList() {
    return this._json.factorList
  }

  setFactorList(arr) {
    this._json.factorList.map((item) => {
      let arrItem = arr.find((val) => val.key == item.key)
      item.value = eval(item.value + arrItem.operator + arrItem.temp)
    })
  }

  getFileJson(url) {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest()
      request.open('get', url)
      request.send(null)
      request.onload = () => {
        if (request.status == '200') {
          let json = JSON.parse(request.responseText)
          resolve(json)
        } else {
          reject({})
        }
      }
    })
  }

  /**
   * 获取JSON
   */
  getJsonList() {
    return this._json
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
   * 获取视频JSON
   */
  getVideoParam(id) {
    let video = this.getPlayList().find((val) => val.videoId == id)
    return video
  }

  /**
   * 获取视频下所有热点名称
   */
  getVideoHotspotName(id) {
    let interactNodeId = this.getVideoParam(id)?.interactNodeId
    let interactNodeIdList = this.getVidioInteract(interactNodeId)
    let list = []
    interactNodeIdList.forEach((val) => {
      let interact = this._compNames.find(
        (item) => item.interactInfoId == val.interactInfoId
      )?.name
      list = list.concat(interact)
    })
    return list
  }
  /**
   * 获取视频内组合按钮
   * interactNodeId:视频参数interactNodeId
   */
  getVidioInteract(interactNodeId) {
    let id = interactNodeId?.split(',')
    let list = []
    id?.forEach((item) => {
      let interactNodeItem = this.getInteractNodeList().find(
        (val) => val.interactNodeId == item
      )
      list.push(interactNodeItem)
    })
    return list
  }

  /**
   * 获取视频内组合按钮具体信息
   * interactNodeId:视频参数interactNodeId
   */
  getVidioInteractInfo(interactNodeId) {
    let list = this.getVidioInteract(interactNodeId)
    let listInfo = []
    list.forEach((item) => {
      let interactInfoIdItem = this.getInteractInfoList().find(
        (val) => val.interactInfoId == item.interactInfoId
      )
      listInfo.push(interactInfoIdItem)
    })
    return listInfo
  }

  /**
   * 获取视频内组合按钮跳转信息
   * interactNodeId:视频参数interactNodeId
   * '/json/interactConfig1.json'
   */
  async getVidioInteractJumpTo(interactNodeId) {
    let listInfo = this.getVidioInteractInfo(interactNodeId)
    let interactConfig = []
    for (let i = 0; i < listInfo.length; i++) {
      let file = this.jsonUrl.replace('index.json', listInfo[i].interactConfig)
      let info = await this.getFileJson(file)
      interactConfig.push(info)
    }
    return interactConfig
  }

  /**
   * 获取全部互动组件列表
   * - 不包含组件控制参数
   * - 只有组件类型和组件配置
   */
  getAllInteractInfoIdJson() {
    let _interactNodeList = this._json.interactNodeList
    let _interactInfoIdJson = []
    _interactNodeList.map((item) => {
      _interactInfoIdJson.push(item.interactInfoIdJson)
    })
    return _interactInfoIdJson
  }

  /**
   * 一次性添加全部热点信息（默认隐藏）
   */
  addAllHotspot() {
    this._compNames = []
    let _interactInfoIdJson = this.getAllInteractInfoIdJson()
    _interactInfoIdJson.map((item) => {
      let type = item.isFollowCamera ? 'layer' : 'hotspot'
      let compType = item.interactInfo.type
      const { btns, ctrls, imgs, metas } = item.interactConfigJson

      let textSetting = null
      let styleSetting = null
      let transform3DSetting = null

      // 文本和互动组件不会同时存在（虽然展示的时候会）
      let comps = metas || btns
      let param = {
        interactInfoId: item.interactInfoId,
        name: [],
      }
      if (comps) {
        comps.map((comp) => {
          let style = comp.style
          // 注意不能以数字开头，哪怕是字符串
          let _id = comp.id
          if (!_id) _id = 0
          let id = item.interactInfoId + _id
          id = id.toLowerCase() //krpano热点名称都是小写
          comp.name = id
          param.name.push(id)
          textSetting = {
            text: comp.text,
            fontSize: style.fontSize,
            fill: style.color,
          }

          // 非文字才会有 styleSetting,默认null
          if (btns) {
            styleSetting = {
              beforeTrigger: this.getImageUrl(comp.backgroundImageBeforeClick),
              triggering: this.getImageUrl(comp.backgroundImageClick),
              afterTrigger: this.getImageUrl(comp.backgroundImageAfterClick),
            }
          }

          transform3DSetting = {
            ...style,
            x: style.posX,
            y: style.posY,
          }

          kxplayer.addInteractiveHotspot(
            id,
            compType,
            type,
            styleSetting,
            textSetting,
            transform3DSetting
          )
        })
        this._compNames.push(param)
      }
    })
  }

  /**
   * 添加视频热点
   * interactNodeId:视频参数interactNodeId
   */
  setVideoHotspot(interactNodeId) {
    let listInfo = this.getVidioInteract(interactNodeId)
    for (let i = 0; i < listInfo.length; i++) {
      let type = listInfo[i].interactInfoIdJson.interactInfo.type
      let info = listInfo[i].interactInfoIdJson.interactConfigJson
      if (type == 'TextModule') {
        //文本
        info.metas.map((item) => {
          let _id = item.id
          if (!_id) _id = 0
          let id = listInfo[i].interactInfoId + _id
          item.name = id
          let style = item.style
          let textSetting = {
            text: item.text,
            align: 'left',
            color: style.color,
            'font-size': style.fontSize,
            'font-family': '',
            'font-style': 'italic',
            'text-decoration': 'line-through',
          }
          let transform3DSetting = {
            x: style.posX,
            y: style.posY,
            width: style.width,
            height: style.height,
            scaleX: style.scaleX,
            rotate: style.rotate,
            opacity: style.opacity,
            rotateX: style.rotateX,
            rotateY: style.rotateY,
            rotateZ: style.rotateZ,
          }
          kxplayer.addInteractiveHotspot(
            id,
            'TextModule',
            'layer',
            null,
            textSetting,
            transform3DSetting
          )
        })
      } else if (type == 'PointClickModule') {
        //点选
        info.btns.map((item) => {
          let _id = item.id
          if (!_id) _id = 0
          let id = listInfo[i].interactInfoId + _id
          item.name = id
          let action = {}
          if (item.action && item.action.length > 0) action = item.action[0]
          let style = item.style
          let textSetting = {
            text: item.text,
            align: 'left',
            color: style.color,
            'font-size': style.fontSize,
            'font-family': '',
            'font-style': 'italic',
            'text-decoration': 'line-through',
          }
          let styleSetting = {
            beforeTrigger: this.getImageUrl(item.backgroundImageBeforeClick),
            triggering: this.getImageUrl(item.backgroundImageClick),
            afterTrigger: this.getImageUrl(item.backgroundImageAfterClick),
          }
          let transform3DSetting = {
            x: style.posX,
            y: style.posY,
            width: style.width,
            height: style.height,
            scaleX: style.scaleX,
            rotate: style.rotate,
            opacity: style.opacity,
            rotateX: style.rotateX,
            rotateY: style.rotateY,
            rotateZ: style.rotateZ,
          }
          kxplayer.addInteractiveHotspot(
            id,
            'PointClickModule',
            'hotspot',
            styleSetting,
            textSetting,
            transform3DSetting
          )
        })
      } else if (type == 'ClickGroupModule') {
        //点击组合
        info.btns.map((item) => {
          let _id = item.id
          if (!_id) _id = 0
          let id = listInfo[i].interactInfoId + _id
          item.name = id
          let action = {}
          if (item.action && item.action.length > 0) action = item.action[0]
          let style = item.style
          let textSetting = {
            text: item.text,
            align: 'left',
            color: style.color,
            'font-size': style.fontSize,
            'font-family': '',
            'font-style': 'italic',
            'text-decoration': 'line-through',
          }
          let styleSetting = {
            beforeTrigger: this.getImageUrl(item.backgroundImageBeforeClick),
            triggering: this.getImageUrl(item.backgroundImageClick),
            afterTrigger: this.getImageUrl(item.backgroundImageAfterClick),
          }
          let transform3DSetting = {
            x: style.posX,
            y: style.posY,
            width: style.width,
            height: style.height,
            scaleX: style.scaleX,
            rotate: style.rotate,
            opacity: style.opacity,
            rotateX: style.rotateX,
            rotateY: style.rotateY,
            rotateZ: style.rotateZ,
          }
          kxplayer.addInteractiveHotspot(
            id,
            'ClickGroupModule',
            'hotspot',
            styleSetting,
            textSetting,
            transform3DSetting
          )
        })
      }
    }
  }
  /**
   * 获取视频地址
   * @param {视频url} videoUrl
   * @returns
   */
  getVideoUrl(videoUrl) {
    return this.jsonUrl.replace('index.json', videoUrl)
  }
  /**
   * 获取图片地址
   * @param {图片url} imgUrl
   * @returns
   */
  getImageUrl(imgUrl) {
    let imgStr = imgUrl.replace('../', '')
    return this.jsonUrl.replace('video/index.json', imgStr)
  }
  /**
   * 获取视频下节点名称
   * @param {视频id} id
   * @returns
   */
  getAllVideoNodeName(id) {
    let interactNodeId = this.getVideoParam(id)?.interactNodeId
    return this.getVidioInteractInfo(interactNodeId)
  }
  /**
   * 添加组件
   * @param {视频id} id
   */
  addVideoHotspot(id) {
    // let interactNodeId = this.getVideoParam(id)?.interactNodeId
    // this.setVideoHotspot(interactNodeId)

    // TODO:根据当前视频和时间判断是否回显
    this.addAllHotspot()
    // setTimeout(() => {
    //   _player.showHotspot(this._compNames)
    // }, 2000)
  }

  getTreeList() {
    return this.treeList
  }

  setTreeList() {
    let id = this._json.drama?.firstVideoId
    let rootVideo = this.getVideoParam(id)
    let rootParam = {
      label: rootVideo.filename,
      id: rootVideo.videoId,
      img: this.getImageUrl(rootVideo.thumbnail),
      children: [],
    }

    this.pathTree(rootParam, id)
    this.treeList = rootParam
  }

  pathTree(paramList, id) {
    let nextid = this.pathTreeClick(id)
    nextid.forEach((item) => {
      let rootVideo = this.getVideoParam(item)
      let param = {
        label: rootVideo.filename,
        id: rootVideo.videoId,
        img: this.getImageUrl(rootVideo.thumbnail),
        children: [],
      }
      paramList.children.push(param)
      this.pathTree(param, item)
    })
  }

  pathTreeClick(id) {
    let treeList = []
    let interactNodeId = this.getVideoParam(id)?.interactNodeId
    let list = this.getVidioInteract(interactNodeId)
    list?.forEach((item) => {
      let interactInfoIdItem = item.interactInfoIdJson

      let ctrls = interactInfoIdItem?.interactConfigJson?.ctrls
      ctrls?.forEach((item) => {
        let conditionConfig = item.conditionConfig
        let video = conditionConfig.jumpVideoId
        if (video) {
          treeList.push(video)
        }
      })
      let btns = interactInfoIdItem?.interactConfigJson?.btns
      btns?.forEach((item) => {
        item?.action?.forEach((actItem) => {
          let nextVideoId = actItem.nextVideo
          if (nextVideoId) {
            treeList.push(nextVideoId)
          }
        })
      })
    })
    let newList = new Set(treeList)
    return newList
  }
}

export default PlayerData
