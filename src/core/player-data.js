class PlayerData {
  constructor(url) {
    this._url = url
    this._json = {}
    this.jsonUrl = url
    this.factorList = []
    this.init()
    // window.getPlayList = this.getPlayList.bind(this);
  }

  init() {
    // let request = new XMLHttpRequest()
    // request.open('get', this.jsonUrl)
    // request.send(null)
    // request.onload = () => {
    //   if (request.status == '200') {
    //     this._json = JSON.parse(request.responseText)
    //     this.factorList = this._json.factorList
    //     // 添加视频
    //     this._json.videoList.forEach((item) => {
    //       let name = item.videoId
    //       let videourl = this.jsonUrl.replace('index.json', item.videoPath)
    //       _krpano.call(
    //         `
    //         videointerface_addsource(${name}, ${videourl}, ${this.getImageUrl(
    //           item.thumbnail
    //         )});
    //         `
    //       )
    //     })

    //     //添加组件
    //     this.addVideoHotspot(this._json.drama?.firstVideoId)
    //   }
    // }

    this.fetchJson(this._url).then((json) => {
      this._json = json
      console.log('json==', json)

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
      let url = this._url.replace('index.json', '') + item.interactConfig
      this.fetchJson(url).then((json) => {
        count++
        // 请求完最后一个json开始拼接进interactInfoList
        if (count == interactInfoList.length) {
          this.concatJsonToInteractNodeList()
        }
        item.interactConfigJson = json
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
    console.log('interactConfigJson==', this._json)
  }

  /**
   * 请求json
   * @param {String} url
   * @returns Promise<json>
   */
  fetchJson(url) {
    return fetch(url).then((response) => response.json())
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
    console.log('JsonList:', this._json)
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
   * 获取视频内组合按钮
   * interactNodeId:视频参数interactNodeId
   */
  getVidioInteract(interactNodeId) {
    let id = interactNodeId.split(',')
    let list = []
    id.forEach((item) => {
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
          let transform2DSetting = {
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
            transform2DSetting
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
          let transform2DSetting = {
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
            transform2DSetting
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
          let transform2DSetting = {
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
            transform2DSetting
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
    let interactNodeId = this.getVideoParam(id)?.interactNodeId
    this.setVideoHotspot(interactNodeId)
  }
}

export default PlayerData
