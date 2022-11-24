class PlayerData {
  constructor(url) {
    this._json = {}
    this.jsonUrl = url
    this.init()
    // window.getPlayList = this.getPlayList.bind(this);
  }

  init() {
    let request = new XMLHttpRequest()
    request.open('get', this.jsonUrl)
    request.send(null)
    request.onload = () => {
      if (request.status == '200') {
        this._json = JSON.parse(request.responseText)

        // 添加视频
        this._json.videoList.forEach((item) => {
          let name = item.videoId
          let videourl = this.jsonUrl.replace('index.json', item.videoPath)
          _krpano.call(
            `
            videointerface_addsource(${name}, ${videourl}, ${this.getImageUrl(
              item.thumbnail
            )});
            `
          )
        })

        //添加组件
        let interactNodeId = this.getFirstVideo()?.interactNodeId
        this.setVideoHotspot(interactNodeId)
      }
    }
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
   * 获取第一个视频JSON
   */
  getFirstVideo() {
    let firstVideoId = this._json.drama?.firstVideoId
    let firstVideo = this.getPlayList().find(
      (val) => val.videoId == firstVideoId
    )
    return firstVideo
  }

  /**
   * 获取视频内组合按钮
   * interactNodeId:视频参数interactNodeId
   */
  getVidioInteract(interactNodeId) {
    // let interactNodeId = this.getFirstVideo()?.interactNodeId
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
  async setVideoHotspot(interactNodeId) {
    let listInfo = this.getVidioInteractInfo(interactNodeId)
    for (let i = 0; i < listInfo.length; i++) {
      let file = this.jsonUrl.replace('index.json', listInfo[i].interactConfig)
      let info = await this.getFileJson(file)
      let type = listInfo[i].interactInfo.type
      if (type == 'TextModule') {
        //文本
        let id = listInfo[i].interactInfoId
        info.metas.forEach((item) => {
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
            true,
            'TextModule',
            'tooltip',
            null,
            textSetting,
            transform2DSetting
          )
        })
      } else if (type == 'PointClickModule') {
        //点选
        info.btns.forEach((item) => {
          let id = listInfo[i].interactInfoId + item.id
          let nextVideo = ''
          if (item.action && item.action.length > 0)
            nextVideo = item.action[0].nextVideo
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
            nextVideo: nextVideo,
          }
          console.log('aaa:', styleSetting)
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
            true,
            'PointClickModule',
            'hotspot',
            styleSetting,
            textSetting,
            transform2DSetting
          )
        })
      } else if (type == 'TextModule') {
        //点击组合
        kxplayer.addInteractiveHotspot('name33')
      }
    }
  }

  getImageUrl(imgUrl) {
    let imgStr = imgUrl.replace('../', '')
    return this.jsonUrl.replace('video/index.json', imgStr)
  }
}

export default PlayerData
