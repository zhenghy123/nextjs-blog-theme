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
    this._currentVideo = null

    this._timer = null
    this.compoundlist = []
    this.init()
  }

  init() {
    //
    this._player._emitter.on('timeupdate', (v) => {
      this._currentTime = v.path[0].currentTime
      // console.log('yes', this._currentVideoId, v)

      // TODO:待优化==
      if (v.path[0].id == this._currentVideoId) {
        let percent = (this._currentTime / this._currentVideo.duration) * 100
        document.querySelector('.progress-played').style.width = percent + '%'
        document.querySelector('.current-time').textContent = format(
          this._currentTime
        )

        document.querySelector('.duration').textContent = format(
          this._currentVideo.duration
        )
        this.toggleHotspot()
        this.playActiveState()
      }
    })

    this._player._options.hotspotClick = (id, type) => {
      console.log('hotspotClick==', id, type)
      // 文本无点击反应
      if (type == 'text') {
        return
      }

      this.pathSpotClick(id)
    }
  }

  /**
   * 根据视频id,当前时间、互动因子判断热点显隐
   */
  toggleHotspot() {
    const { ids, activeNodes } = this._parser.getActivetCompIds(
      this._currentVideoId,
      this._currentTime
    )

    let btnItem = []
    activeNodes?.forEach((item) => {
      // 根据互动因子过滤出要显示的ids（互动因子作用分两种：分支选择作用在按钮，组合点击作用在整体）
      if (
        item?.interactInfoIdJson?.interactInfo?.type ==
        enumTranslate.ClickGroupModule
      ) {
        let visible_item = this.factorState(item)
        if (!visible_item)
          btnItem = this._parser.getInteractNodeIds(item.interactNodeId)
      } else if (
        item?.interactInfoIdJson?.interactInfo?.type ==
        enumTranslate.PointClickModule
      ) {
        let btnList = item.interactInfoIdJson.interactConfigJson.btns
        btnList.forEach((param) => {
          let btnVisible = this.factorState(param)
          if (!btnVisible) btnItem.push(param.id)
        })
      }
    })
    let idList = ids.filter((idItem) => {
      return !btnItem.includes(idItem)
    })
    this._player.showHotspot(idList)
  }

  /**
   * 视频播放状态
   */
  playActiveState() {
    const { ids, activeNodes } = this._parser.getActivetCompIds(
      this._currentVideoId,
      this._currentTime
    )
    // 组件结束时间点可播放视频（继续播放）
    activeNodes?.map((item) => {
      if (
        item?.interactInfoIdJson?.interactInfo?.type == enumTranslate.TextModule
      )
        return
      let startTime = item.startTime
      let duration = item.duration
      let playState = item.playState
      let endState = item.endState
      // 开始状态
      if (Math.abs(this._currentTime - startTime) < 0.02) {
        if (playState == PlayerEvents.VIDEO_PAUSE) {
          // 组件开始时间点可暂停视频
          this._player.pause()
          item.playState = 'active'
        } else if (playState == PlayerEvents.VIDEO_PLAY) {
          // 组件开始时间点可播放视频（继续播放）
          // this._player.play()
          // item.playState = 'active'
        }
      }
      // 结束状态
      if (Math.abs(this._currentTime - (startTime + duration)) < 0.02) {
        if (endState == PlayerEvents.VIDEO_PAUSE) {
          // 组件结束时间点可暂停视频
          this._player.pause()
          item.endState = 'active'
        } else if (endState == HotToState.CountDown) {
          // 组件结束时间点可触发倒计时--计时结束触发某一个子控件上的事件
          let ctrls = item.interactInfoIdJson?.interactConfigJson?.ctrls
          let ctrlsItem = ctrls?.find(
            (item) => item.countDown != null
          )?.countDown
          if (ctrlsItem.time) {
            this.handleCountDown(ctrlsItem.time)?.then(() => {
              if (ctrlsItem.jumpVideoId != null) {
                this.changeVideo(ctrlsItem.jumpVideoId)
              } else if (ctrlsItem.jumpTime != null) {
                this._player.setCurrentTime(ctrlsItem.jumpTime)
              }
            })
          }
        }
      }
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

    this._currentVideo = videoItem.video
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

    // 点击音效（都有）
    hotspotBtn.audioContext && hotspotBtn.audioContext.play()

    if (
      interactInfoIdItem?.interactInfo?.type == enumTranslate.ClickGroupModule
    ) {
      // 组合点击
      //TODO  : 任意点击两个？
      let count = interactInfoIdItem.interactInfo.clickCount
      // 条件
      if (this.compoundlist.length >= count) {
        this.compoundlist.shift()
      }
      if (this.compoundlist.indexOf(hotspotBtn.id) != -1) {
        this.compoundlist = this.compoundlist.filter(
          (item) => item != hotspotBtn.id
        )
      } else {
        this.compoundlist.push(hotspotBtn.id)
      }

      // 结果
      let ctrls = interactInfoIdItem?.interactConfigJson?.ctrls
      ctrls?.forEach((item) => {
        let conditionConfig = item.conditionConfig
        let conditionValue = conditionConfig?.conditionValue || []

        let compoundMode = interactInfoIdItem.interactInfo.compoundMode
        if (compoundMode == CompoundOrder.DISORDER) {
          this.compoundlist = this.compoundlist.sort()
          conditionValue = conditionValue.sort()
        }
        // 匹配正确
        if (conditionValue?.toString() === this.compoundlist?.toString()) {
          if (conditionConfig.jumpVideoId != null) {
            // 跳故事节点（分支选项&立即触发）
            this.changeVideo(conditionConfig.jumpVideoId)
          } else if (conditionConfig.jumpTime != null) {
            // 跳当前时间（分支选项&立即触发）
            this._player.setCurrentTime(conditionConfig.jumpTime)
          }
        } else {
          if (
            conditionValue.length == this.compoundlist.length &&
            conditionValue.length > 0
          ) {
            // 失败：错误提示
            Qmsg.info(conditionConfig.errorTip || '答案错误')
            this.compoundlist = []
          }
        }
      })
      setTimeout(() => {
        this.compoundlist = []
      }, 5000)
    } else {
      // 点击
      this.pointHotClick(hotspotBtn)
    }
  }

  // 热点-点击
  pointHotClick(hotspotBtn) {
    hotspotBtn?.action?.forEach((actItem) => {
      if (actItem.actionType == HotToState.SWITCHVIDEO) {
        // 跳故事节点（分支选项&立即触发）
        let nextVideoId = actItem.nextVideo
        this.changeVideo(nextVideoId)
      } else if (actItem.actionType == HotToState.JUMPTIME) {
        // 跳当前时间（分支选项&立即触发）
        this._player.setCurrentTime(actItem.jumpTime)
      } else if (actItem.actionType == HotToState.FACTOR) {
        //TODO 互动因子提前？
        // 互动因子：互动因控制显隐|互动因子计算（立即重刷toggleHotspot，刷新显隐）
        let factorExpressList = actItem.factorExpressList
        this._parser.set_factorList(factorExpressList)

        this.toggleHotspot()
      }
    })
  }

  changeVideo(nextVideoId) {
    let flag = this._currentVideo.paused
    this._currentVideo.pause()
    //切视频
    let videoItem = this._parser.getVideoItem(nextVideoId)
    if (videoItem.video.currentTime == 0) {
      videoItem.video.currentTime = 0.0001
    }
    this._currentVideo = videoItem.video
    this._currentVideoId = nextVideoId
    this._player.changeVideo(videoItem.video)
    this.setMainFov(videoItem.fovInfo)
    if (!flag) {
      setTimeout(() => {
        this._currentVideo.play()
      }, 300)
    }
  }

  // 互动因子 显隐状态
  factorState(factorItem) {
    let visible_item = true
    let factorList = this._parser.get_factorList()
    let showConditionList = factorItem.showConditionList
    showConditionList?.forEach((item) => {
      let value = factorList?.find((val) => val.key == item.key)?.value
      if (item && value && !eval(value + item.operator + item.temp)) {
        visible_item = false
      }
    })
    return visible_item
  }
}
