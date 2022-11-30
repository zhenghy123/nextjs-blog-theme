import { enumTranslate, HotToState, CompoundOrder } from './player-interactives'
import { PlayerEvents } from './player-events'

var timeId = null
var compoundId = null
var compoundlist = []
/**
 * 时间进度path处理
 * @param {*} val
 */
export function pathTimeUpdate(val) {
  let time = kxplayer.getCurrentTime()
  let id = kxplayer.getVideoId()
  let interactNodeId = playList.getVideoParam(id)?.interactNodeId
  let list = playList.getVidioInteract(interactNodeId)
  list?.forEach((item) => {
    let startTime = item.startTime
    let duration = item.duration
    let playState = item.playState
    let endState = item.endState
    // 播放状态
    if (time * 1000 - startTime < 200) {
      if (playState == PlayerEvents.VIDEO_PAUSE) {
        kxplayer.pause()
      } else if (playState == PlayerEvents.VIDEO_PLAY && time > 0.01) {
        kxplayer.play()
      }
    }
    if (time * 1000 - duration < 200 && endState == PlayerEvents.VIDEO_PAUSE) {
      kxplayer.pause()
    }

    let visible_item = factorState(item) // 互动因子显隐
    // 时间段
    if (visible_item) {
      if (time * 1000 >= startTime && time * 1000 < duration) {
        visible_item = true
      } else if (time * 1000 >= duration) {
        if (endState == HotToState.HIDE) {
          visible_item = false
        } else if (endState == HotToState.CountDown) {
          // 倒计时
          let ctrls = item.interactInfoIdJson?.interactConfigJson?.ctrls
          let ctrlsItem = ctrls?.find(
            (item) => item.countDown != null
          )?.countDown
          if (ctrlsItem.time) {
            timeId = setTimeout(() => {
              if (ctrlsItem.jumpVideoId != null) {
                changeVideo(id, ctrlsItem.jumpVideoId)
                clearTimeout(timeId)
              } else if (ctrlsItem.jumpTime != null) {
                kxplayer.setCurrentTime(ctrlsItem.jumpTime / 1000)
                clearTimeout(timeId)
              }
            }, ctrlsItem.time)
          }
        }
      } else {
        visible_item = false
      }
    }
    let interactInfoIdItem = item.interactInfoIdJson
    let type =
      interactInfoIdItem?.interactInfo?.type == enumTranslate.TextModule
        ? 'layer'
        : 'hotspot'
    let list =
      type == 'layer'
        ? interactInfoIdItem?.interactConfigJson?.metas
        : interactInfoIdItem?.interactConfigJson?.btns
    list?.forEach((item) => {
      let factor = factorState(item)
      kxplayer.showOrHideComp(
        item.name?.toLowerCase(),
        type,
        visible_item && factor
      )
    })
  })
}

/**
 * 热点点击处理
 * @param {*} val
 */
export function pathSpotClick(val) {
  alert(2)
  clearTimeout(compoundId)
  let id = kxplayer.getVideoId()
  let interactNodeId = playList.getVideoParam(id)?.interactNodeId
  let list = playList.getVidioInteract(interactNodeId)
  list?.forEach((item) => {
    let interactInfoIdItem = item.interactInfoIdJson
    let interactInfoList = interactInfoIdItem?.interactConfigJson?.btns
    let hotspotBtn = interactInfoList?.find(
      (item) => item.name.toLowerCase() == val
    )

    let factor = factorState(hotspotBtn)
    kxplayer.showOrHideComp(hotspotBtn?.name?.toLowerCase(), 'hotspot', factor)

    if (
      interactInfoIdItem?.interactInfo?.type == enumTranslate.ClickGroupModule
    ) {
      // 组合点击
      let count = interactInfoIdItem.interactInfo.clickCount
      // 条件
      if (compoundlist.length >= count) {
        compoundlist.shift()
      }
      compoundlist.push(parseInt(hotspotBtn.text))

      // 结果
      let ctrls = interactInfoIdItem?.interactConfigJson?.ctrls
      ctrls?.forEach((item) => {
        let conditionConfig = item.conditionConfig
        let conditionValue = conditionConfig?.conditionValue

        let compoundMode = interactInfoIdItem.interactInfo.compoundMode
        if (compoundMode == CompoundOrder.DISORDER) {
          compoundlist = compoundlist.sort()
          conditionValue = conditionValue.sort()
        }
        // 匹配正确
        if (conditionValue.toString() === compoundlist.toString()) {
          if (conditionConfig.jumpVideoId != null) {
            changeVideo(id, conditionConfig.jumpVideoId)
          } else if (conditionConfig.jumpTime != null) {
            kxplayer.setCurrentTime(conditionConfig.jumpTime / 1000)
          }
        }
      })
      compoundId = setTimeout(() => {
        compoundlist = []
      }, 2000)
    } else {
      // 点击
      pointHotClick(hotspotBtn, id)
    }
  })
}

// 热点-点击
function pointHotClick(hotspotBtn, lastVideoId) {
  alert(1)
  hotspotBtn?.action?.forEach((actItem) => {
    if (actItem.actionType == HotToState.SWITCHVIDEO) {
      // 切视频
      let nextVideoId = actItem.nextVideo
      changeVideo(lastVideoId, nextVideoId)
    } else if (actItem.actionType == HotToState.JUMPTIME) {
      // 切进度
      kxplayer.setCurrentTime(actItem.jumpTime)
    } else if (actItem.actionType == HotToState.FACTOR) {
      // 更新互动因子
      let factorExpressList = actItem.factorExpressList
      playList.setFactorList(factorExpressList)

      let factor = factorState(hotspotBtn)
      kxplayer.showOrHideComp(
        hotspotBtn?.name?.toLowerCase(),
        'hotspot',
        factor
      )
    }
  })
}

function changeVideo(lastVideoId, nextVideoId) {
  // 隐藏热点
  let lastArray = playList.getVideoHotspotName(lastVideoId)
  kxplayer.showHotspot(lastArray, false)

  //切视频
  let nextVideo = playList.getVideoParam(nextVideoId)
  let url = playList.getVideoUrl(nextVideo.videoPath)
  kxplayer.changeVideo(url, nextVideoId)
}

// 删除视频的热点和文本
function delHotspot(interactNodeId) {
  let interactlist = playList.getVidioInteract(interactNodeId)
  interactlist?.forEach((item) => {
    let interactInfoIdItem = item.interactInfoIdJson
    let metas = interactInfoIdItem?.interactConfigJson?.metas
    metas?.forEach((item) => {
      kxplayer.removeHotspot(item.name?.toLowerCase())
    })
    let btns = interactInfoIdItem?.interactConfigJson?.btns
    btns?.forEach((item) => {
      kxplayer.removeHotspot(item.name?.toLowerCase())
    })
  })
}

// 互动因子 显隐状态
function factorState(factorItem) {
  if (!factorItem) return true
  let visible_item = true
  let factorList = playList.getFactorList()
  let showConditionList = factorItem.showConditionList
  showConditionList?.forEach((item) => {
    let value = factorList.find((val) => val.key == item.key)?.value
    if (!eval(value + item.operator + item.temp)) {
      visible_item = false
    }
  })
  return visible_item
}
