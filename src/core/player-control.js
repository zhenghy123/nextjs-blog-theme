import { PlayerEvents } from './player-events'
import { enumTranslate, HotToState, CompoundOrder } from './player-interactives'

const eventFns = {}
// 播放器控制
export class PlayerControl {
  constructor(_player, _parser) {
    this._player = _player
    this._parser = _parser

    this._currentTime = 0 // 毫秒
    this._currentVideoId = ''
    this._currentVideo = null

    this._timer = -1
    this._timer1 = -1
    // 组合点击结果:Map<节点id>(Set<按钮id>）
    this.conditionValue = new Map()
    this.init()
  }

  init() {
    //
    this._player._emitter.on('timeupdate', (v) => {
      this._currentTime = v.path[0].currentTime
      // TODO:待优化==
      if (v.path[0].id == this._currentVideoId) {
        this.toggleHotspot()
        this.playActiveState()
      }
    })

    this._player._emitter.on('videotime', (v) => {
      this._currentTime = v
      this.toggleHotspot()
      this.playActiveState()
    })

    this._player._options.hotspotClick = (id, type) => {
      // 文本无点击反应
      if (type == 'text') {
        return
      }

      // 注意：如果pathSpotClick内有报错会导致hotspotClick调用两次
      // （如果存在调用两次的情况请排查pathSpotClick内的代码）
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
      if (
        Math.abs(this._currentTime - startTime) < 0.02 &&
        !this._currentVideo.paused
      ) {
        console.log('开始状态', playState, item)
        if (playState == PlayerEvents.VIDEO_PAUSE) {
          // 组件开始时间点可暂停视频
          this._player.pause()
          // item.playState = 'active'
        } else if (playState == PlayerEvents.VIDEO_PLAY) {
          // 组件开始时间点可播放视频（继续播放）
          // this._player.play()
          // item.playState = 'active'
        }
      }
      // 结束状态
      if (
        Math.abs(this._currentTime - (startTime + duration)) < 0.02 &&
        !this._currentVideo.paused
      ) {
        console.log('结束状态', endState)
        if (endState == PlayerEvents.VIDEO_PAUSE) {
          // 组件结束时间点可暂停视频
          this._player.pause()
          // item.endState = 'active'
        } else if (endState == HotToState.CountDown) {
          // 组件结束时间点可触发倒计时--计时结束触发某一个子控件上的事件
          const { ctrls = [], btns = [] } =
            item.interactInfoIdJson?.interactConfigJson
          let countDown = ctrls?.find(
            (item) => item.countDown != null
          )?.countDown
          if (countDown?.time) {
            this.handleCountDown(countDown.time * 1000).then(() => {
              if (countDown.jumpVideoId != null) {
                this.changeVideo(countDown.jumpVideoId)
              } else if (countDown.jumpTime != null) {
                this._currentVideo.currentTime = countDown.jumpTime
              }
            })
          }

          // 分支选项倒计时
          btns.map((btn) => {
            let id = ''
            let time = ''
            btn.action.map((act) => {
              id = act.jumpVideoId || act.nextVideo || act.skipVideoId
              time = act.jumpTime
            })
            if (id) {
              this.changeVideo(id)
            } else if (time) {
              this._currentVideo.currentTime = time
            }
            // else   {
            //   throw new Error(`节点${item.id}没有可跳转信息`)
            // }
          })
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
    return new Promise((resolve) => {
      if (this._timer) {
        clearInterval(this._timer)
      }

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

    // 组合点击
    if (
      interactInfoIdItem?.interactInfo?.type == enumTranslate.ClickGroupModule
    ) {
      if (this._timer1) {
        clearTimeout(this._timer1)
        this._timer1 = -1
      }

      // 采用 Map(<Set>)的层级嵌套接口，兼容一个画面设置多个组合点击
      let setObj = this.conditionValue.get(interactInfoIdItem.interactInfoId)
      if (!!setObj) {
        if (setObj.has(hotspotBtn.id)) {
          setObj.delete(hotspotBtn.id)
        } else {
          setObj.add(hotspotBtn.id)
        }
      } else {
        this.conditionValue.set(
          interactInfoIdItem.interactInfoId,
          new Set().add(hotspotBtn.id)
        )
      }

      setObj = this.conditionValue.get(interactInfoIdItem.interactInfoId)
      if (!setObj) {
        return
      }

      // 结果
      let ctrls = interactInfoIdItem.interactConfigJson.ctrls
      ctrls.forEach((item) => {
        let conditionConfig = item.conditionConfig
        let conditionValue = conditionConfig?.conditionValue || []
        // 组合点击数量（初期只有设置点击次数时会有此值，有序、无序此值为null）
        let count = interactInfoIdItem.interactInfo.clickCount
        // console.log('答案：', count, conditionValue, [...setObj])

        // 判断有序和无序
        let compoundMode = interactInfoIdItem.interactInfo.compoundMode
        let answer = [...setObj]

        if (compoundMode == CompoundOrder.DISORDER) {
          answer = answer.sort()
          conditionValue = conditionValue.sort()
          console.log('无序组合点击', interactInfoIdItem.interactInfo)
        }

        // 匹配正确
        if (conditionValue.length == 0 && !conditionConfig.jumpTime && !count) {
          Qmsg.error('数据不完整，请设置点击组合组件跳转节点或跳转时间')
          console.error(
            `数据不完整，请设置点击组合组件跳转节点或跳转时间 ${interactInfoIdItem.interactInfoId}`,
            interactInfoIdItem
          )
        } else if (
          (!count && conditionValue.toString() === answer.toString()) ||
          (count && setObj.size == count)
        ) {
          // 如果有count代表是点击数量
          // console.log('xx', count, setObj, conditionConfig)

          if (conditionConfig.jumpVideoId != null) {
            // 跳故事节点
            this.changeVideo(conditionConfig.jumpVideoId)
            this.conditionValue.clear()
            this.clearClickGroupSel()
          } else if (conditionConfig.jumpTime != null) {
            // 跳当前时间
            this._currentVideo.currentTime = conditionConfig.jumpTime
            this.conditionValue.clear()
            this.clearClickGroupSel()
          }
        } else {
          if (
            (!count && conditionValue.length <= answer.length) ||
            (count && count <= answer.length)
          ) {
            // console.log(count, conditionValue.length, answer.length)
            // 失败：错误提示
            Qmsg.error(conditionConfig.errorTip || '答案错误')
            this.conditionValue.clear()
            this.clearClickGroupSel()
          }
        }
      })

      // 组合点击互动因子更新
      hotspotBtn?.action?.forEach((actItem) => {
        if (actItem.actionType == HotToState.FACTOR) {
          let factorExpressList = actItem.factorExpressList
          this._parser.set_factorList(factorExpressList)

          this.toggleHotspot()
        }
      })

      this.toggleHotspot()
      this._timer1 = setTimeout(() => {
        this.conditionValue.clear()
        this.clearClickGroupSel()
      }, 5000)
    } else {
      // 点击
      this.pointHotClick(hotspotBtn)
    }
    setTimeout(() => {
      hotspotBtn.audioContext && hotspotBtn.audioContext.pause()
    }, 1000)
  }

  /**
   * 清空组合点击选中效果
   */
  clearClickGroupSel() {
    const { ids } = this._parser.getActivetCompIds(
      this._currentVideoId,
      this._currentTime
    )

    ids.map((id) => {
      let obj = this._player.getHotspot(id)
      if (obj.compname == 'ClickGroupModule') {
        obj.checked = false
        obj.url = obj.beforetrigger
      }
    })
  }

  // 热点-点击
  pointHotClick(hotspotBtn) {
    hotspotBtn?.action?.forEach((actItem) => {
      if (actItem.actionType == HotToState.SWITCHVIDEO) {
        // 跳故事节点（分支选项&立即触发）
        let nextVideoId = actItem.nextVideo || actItem.skipVideoId
        this.changeVideo(nextVideoId)
      } else if (actItem.actionType == HotToState.JUMPTIME) {
        this._currentVideo.currentTime = actItem.jumpTime
        // 跳当前时间（分支选项&立即触发）
        // this._player.setCurrentTime(actItem.jumpTime)
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
    if (nextVideoId == this._currentVideoId) return
    let flag = this._currentVideo.paused
    this._currentVideo.pause()

    //切视频
    let videoItem = this._parser.getVideoItem(nextVideoId)
    if (!videoItem) {
      Qmsg.error('内容不存在')
      return
    }
    console.log('videoItem==', videoItem, nextVideoId)
    if (videoItem.video.currentTime == 0) {
      videoItem.video.currentTime = 0.0001
    }

    this._currentVideo = videoItem.video
    this._currentVideoId = nextVideoId
    this._player.changeVideo(videoItem.video)
    this.setMainFov(videoItem.fovInfo)
    this._player._emitter.emit('videoChange')

    this.toggleHotspot()

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
