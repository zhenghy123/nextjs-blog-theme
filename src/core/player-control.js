import { PlayerEvents } from './player-events'
import { enumTranslate, HotToState, CompoundOrder } from './player-interactives'

const eventFns = {}
// 播放器控制
export class PlayerControl {
  constructor(_player, _parser) {
    console.log('_player:', _player)
    this._player = _player
    this._parser = _parser

    this._currentTime = 0 // 毫秒
    this._currentVideoId = ''
    this.currentVideo = null

    this._timer = null
    this.compoundlist = []
    this.init()
  }

  init() {
    //
    this._player._emitter.on('timeupdate', (v) => {
      this._currentTime = v.path[0].currentTime
      // console.log('v==', this._currentTime * 1000)

      // TODO:待优化==
      if (v.path[0].id == this._currentVideoId) {
        console.log('yes', this._currentTime)

        let percent = (this._currentTime / this.currentVideo.duration) * 100
        document.querySelector('.progress-played').style.width = percent + '%'
        document.querySelector('.current-time').textContent = format(
          this._currentTime
        )

        document.querySelector('.duration').textContent = format(
          this.currentVideo.duration
        )

        this.toggleHotspot()
      }
    })

    this._player._options.hotspotClick = (id, type) => {
      console.log('hotspotClick==', id, type)
      // 文本无点击反应
      if (type == 'text') {
        return
      }
      // 点击音效（都有）

      this.pathSpotClick(id)
    }

    this._player._options.setMainFov = (fovInfo) => {
      console.log('setMainFov==', fovInfo)
    }
  }

  /**
   * 根据视频id,当前时间、互动因子判断热点显隐
   */
  toggleHotspot() {
    let activeNodes = this._parser.getVideoNodeConfig(this._currentVideoId)

    // 组件结束时间点可播放视频（继续播放）
    activeNodes?.forEach((item) => {
      let startTime = item.startTime
      let duration = item.duration
      let playState = item.playState
      let endState = item.endState
      // 播放状态
      if (this._currentTime * 1000 - startTime < 200) {
        if (playState == PlayerEvents.VIDEO_PAUSE) {
          // 组件开始时间点可暂停视频
          this._player.pause()
        } else if (
          playState == PlayerEvents.VIDEO_PLAY &&
          this._currentTime > 0.01
        ) {
          // 组件开始时间点可播放视频（继续播放）
          this._player.play()
        }
      }
      if (
        this._currentTime * 1000 - duration < 200 &&
        endState == PlayerEvents.VIDEO_PAUSE
      ) {
        // 组件结束时间点可暂停视频
        this._player.pause()
      }

      // 组件显隐
      let visible_item = this.factorState(item) // 互动因子显隐
      // 时间段
      if (visible_item) {
        if (
          this._currentTime * 1000 >= startTime &&
          this._currentTime * 1000 < duration
        ) {
          visible_item = true
        } else if (this._currentTime * 1000 >= duration) {
          if (endState == HotToState.HIDE) {
            visible_item = false
          } else if (endState == HotToState.CountDown) {
            // 组件结束时间点可触发倒计时--计时结束触发某一个子控件上的事件
            let ctrls = item.interactInfoIdJson?.interactConfigJson?.ctrls
            let ctrlsItem = ctrls?.find(
              (item) => item.countDown != null
            )?.countDown
            if (ctrlsItem.time) {
              this.handleCountDown(ctrlsItem.time)?.then(() => {
                if (ctrlsItem.jumpVideoId != null) {
                  this.changeVideo(this._currentVideoId, ctrlsItem.jumpVideoId)
                } else if (ctrlsItem.jumpTime != null) {
                  this._player.setCurrentTime(ctrlsItem.jumpTime / 1000)
                }
              })
            }
          }
        } else {
          visible_item = false
        }
      }
      let nodes = this._parser.getInteractNodeIds(item.interactNodeId)
      this._player.showHotspot(nodes, visible_item)
    })
  }

  /**
   * 设置或恢复默认fov信息
   * 在视频切换时需要调用
   * @param {String} fovInfo
   */
  setMainFov(fovInfo) {
    if (fovInfo) {
      this._player.setMainFov(fovInfo)
    } else {
      // 没有则回复默认设置
      let _fovInfo = {
        hlookat: 0,
        vlookat: 0,
        fov: 90,
      }
      this._player.setMainFov(JSON.stringify(_fovInfo))
    }
  }

  /**
   * 处理倒计时
   * TODO:倒计时期间是否响应其他操作待确认，_timer可提到this中
   * @param {Number} count
   * @returns
   */
  handleCountDown(count) {
    if (this._timer) {
      return
    }
    return new Promise((resolve) => {
      let _count = count
      this._timer = setInterval(() => {
        Qmsg.info(`倒计时${_count}`)
        if (_count <= 0) {
          clearInterval(this._timer)
          this._timer = null
          resolve()
        }
        _count--
      }, 1000)
    })
  }

  /**
   * 初始化首个视频
   */
  initFirstVideo() {
    this._currentVideoId = this._parser._firstVideoId
    let videoItem = this._parser.getVideoItem(this._parser._firstVideoId)

    if (videoItem.video.currentTime == 0) {
      videoItem.video.currentTime = 0.0001
    }

    this.currentVideo = videoItem.video
    this._player.changeVideo(videoItem.video)
    this.setMainFov(videoItem.fovInfo)
  }

  //
  addVideoListener(video) {
    let keys = Object.keys(PlayerEvents)
    keys.map((item) => {
      eventFns[item] = (val) => {
        // this._player.update()
        this._player._emitter.emit(PlayerEvents[item], val)
      }
      video.addEventListener(PlayerEvents[item], eventFns[item], false)
    })
  }

  removeVideoListener(video) {
    let keys = Object.keys(PlayerEvents)
    keys.map((item) => {
      video.removeEventListener(PlayerEvents[item], eventFns[item], false)
    })
  }

  /**
   * 热点点击处理
   * @param {*} val
   */
  pathSpotClick(id) {
    let interactInfoIdItem = this._parser.getInteractConfigJsonItem(id)
    let interactInfoList = interactInfoIdItem?.interactConfigJson?.btns
    let hotspotBtn = interactInfoList?.find((item) => item.id == id)
    if (
      interactInfoIdItem?.interactInfo?.type == enumTranslate.ClickGroupModule
    ) {
      // 组合点击
      let count = interactInfoIdItem.interactInfo.clickCount
      // 条件
      if (this.compoundlist.length >= count) {
        this.compoundlist.shift()
      }
      if (this.compoundlist.indexOf(parseInt(hotspotBtn.text)) != -1){
        this.compoundlist = this.compoundlist.filter(item=>item != parseInt(hotspotBtn.text))

      } else {
        this.compoundlist.push(parseInt(hotspotBtn.text))
      }      

      // 结果
      let ctrls = interactInfoIdItem?.interactConfigJson?.ctrls
      ctrls?.forEach((item) => {
        let conditionConfig = item.conditionConfig
        let conditionValue = conditionConfig?.conditionValue

        let compoundMode = interactInfoIdItem.interactInfo.compoundMode
        if (compoundMode == CompoundOrder.DISORDER) {
          this.compoundlist = this.compoundlist.sort()
          conditionValue = conditionValue.sort()
        }
        // 匹配正确
        if (conditionValue.toString() === this.compoundlist.toString()) {
          if (conditionConfig.jumpVideoId != null) {
            // 跳故事节点（分支选项&立即触发）
            this.changeVideo(this._currentVideoId, conditionConfig.jumpVideoId)
          } else if (conditionConfig.jumpTime != null) {
            // 跳当前时间（分支选项&立即触发）
            this._player.setCurrentTime(conditionConfig.jumpTime / 1000)
          }
        } else {
          if (
            conditionValue.length == this.compoundlist.length &&
            conditionValue.length > 0
          ) {
            // 失败：错误提示
            Qmsg.info(conditionConfig.errorTip)
          }
        }
      })
      this.handleCountDown(2)?.then(() => {
        this.compoundlist = []
      })
    } else {
      // 点击
      this.pointHotClick(hotspotBtn, this._currentVideoId)
    }
  }

  // 热点-点击
  pointHotClick(hotspotBtn, lastVideoId) {
    hotspotBtn?.action?.forEach((actItem) => {
      if (actItem.actionType == HotToState.SWITCHVIDEO) {
        // 跳故事节点（分支选项&立即触发）
        let nextVideoId = actItem.nextVideo
        this.changeVideo(lastVideoId, nextVideoId)
      } else if (actItem.actionType == HotToState.JUMPTIME) {
        // 跳当前时间（分支选项&立即触发）
        this._player.setCurrentTime(actItem.jumpTime / 1000)
      } else if (actItem.actionType == HotToState.FACTOR) {
        // 互动因子：互动因控制显隐|互动因子计算（立即重刷toggleHotspot，刷新显隐）
        let factorExpressList = actItem.factorExpressList
        this._parser.set_factorList(factorExpressList)

        let factor = this.factorState(hotspotBtn)
        this._player.showOrHideComp(hotspotBtn?.id, 'hotspot', factor)
      }
    })
  }

  changeVideo(lastVideoId, nextVideoId) {
    // 隐藏热点
    let lastArray = this._parser.getVideoHotspotName(lastVideoId)
    this._player.showHotspot(lastArray, false)

    //切视频
    let videoItem = this._parser.getVideoItem(nextVideoId)
    if (videoItem.video.currentTime == 0) {
      videoItem.video.currentTime = 0.0001
    }
    this.currentVideo = videoItem.video
    this._currentVideoId = nextVideoId
    this._player.changeVideo(videoItem.video)
    this.setMainFov(videoItem.fovInfo)
  }

  // 互动因子 显隐状态
  factorState(factorItem) {
    if (!factorItem) return true
    let visible_item = true
    let factorList = this._parser.get_factorList()
    let showConditionList = factorItem.showConditionList
    showConditionList?.forEach((item) => {
      let value = factorList?.find((val) => val.key == item.key)?.value
      if (value && !eval(value + item.operator + item.temp)) {
        visible_item = false
      }
    })
    return visible_item
  }
}
