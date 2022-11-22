class PlayerData {
  constructor() {
    this._json = {};
    this.init()
    // window.getPlayList = this.getPlayList.bind(this);
  }

  init() {
    let file = "/json/index.json"
    let request = new XMLHttpRequest();
    request.open("get", file);
    request.send(null);
    request.onload = () => {
      if (request.status == "200") {
        this._json = JSON.parse(request.responseText);
      }
    };
  }

  getFileJson(url = '/json/interactConfig1.json') {
    return new Promise((resolve, reject) => {
      let request = new XMLHttpRequest();
      request.open("get", url);
      request.send(null);
      request.onload = () => {
        if (request.status == "200") {
          let json = JSON.parse(request.responseText);
          resolve(json)
        } else {
          reject({})
        }
      };
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
    let firstVideo = this.getPlayList().find((val) => val.videoId == firstVideoId)
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
    id.forEach(item => {
      let interactNodeItem = this.getInteractNodeList().find((val) => val.interactNodeId == item)
      list.push(interactNodeItem)
    });
    return list
  }

  /**
   * 获取视频内组合按钮详细信息
   * interactNodeId:视频参数interactNodeId
   * '/json/interactConfig1.json'
   */
  async getVidioInteractInfo(interactNodeId) {
    let list = this.getVidioInteract(interactNodeId)
    let listInfo = []
    list.forEach(item => {
      let interactInfoIdItem = this.getInteractInfoList().find((val) => val.interactInfoId == item.interactInfoId)
      listInfo.push(interactInfoIdItem)
    });
    let interactConfig = []
    for (let i = 0; i < listInfo.length; i++) {
      let file = '/json/' + listInfo[i].interactConfig
      let info = await this.getFileJson(file)
      interactConfig.push(info)
    }
    return interactConfig
  }
}

export default PlayerData
