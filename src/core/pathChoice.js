import { enumTranslate, HotToState } from './player-interactives'
import { PlayerEvents } from './player-events'

/**
 * 时间进度path处理
 * @param {*} val
 */
export function pathTimeUpdate(val) {
  let time = kxplayer.getCurrentTime()
  let id = kxplayer.getVideoId()
  let interactNodeId = playList.getVideoParam(id)?.interactNodeId
  let list = playList.getVidioInteract(interactNodeId)
  let factorList = playList.getFactorList()
  list.forEach((item) => {
    let startTime = item.startTime
    let duration = item.duration
    let playState = item.playState
    let endState = item.endState
    // 播放状态
    if (Math.floor(time) == startTime) {
      if (playState == PlayerEvents.VIDEO_PAUSE) {
        kxplayer.pause()
      } else if (playState == PlayerEvents.VIDEO_PLAY && time > 0.01) {
        kxplayer.play()
      }
    }
    if (Math.floor(time) == duration && endState == PlayerEvents.VIDEO_PAUSE) {
      kxplayer.pause()
    }

    let visible_item = true // 显隐状态
    let showConditionList = item.showConditionList // 互动因子
    showConditionList.forEach((item) => {
      let value = factorList.find((val) => val.key == item.key)?.value
      if (!eval(value + item.operator + item.temp)) {
        visible_item = false
      }
    })
    // 时间段
    if (visible_item) {
      if (time >= startTime && time < duration) {
        visible_item = true
      } else if (time >= duration) {
        if (endState == HotToState.HIDE) {
          visible_item = false
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
    list.forEach((item) => {
      kxplayer.showOrHideComp(item.name?.toLowerCase(), type, visible_item)
    })
  })
}

/**
 * 热点点击处理
 * @param {*} val
 */
export function pathSpotClick(val) {
  let id = kxplayer.getVideoId()
  let interactNodeId = playList.getVideoParam(id)?.interactNodeId
  let list = playList.getVidioInteract(interactNodeId)
  list.forEach((item) => {
    let interactInfoIdItem = item.interactInfoIdJson
    let interactInfoList = interactInfoIdItem?.interactConfigJson?.btns
    let hotspotBtn = interactInfoList?.find(
      (item) => item.name.toLowerCase() == val
    )

    hotspotBtn?.action?.forEach((actItem) => {
      if (actItem.actionType == HotToState.SWITCHVIDEO) {
        // 删除上一个视频的热点和文本
        delHotspot(interactNodeId)

        //切视频
        let nextVideoId = actItem.nextVideo
        let nextVideo = playList.getVideoParam(nextVideoId)
        let url = playList.getVideoUrl(nextVideo.videoPath)
        kxplayer.changeVideo(url, nextVideoId)

        // 添加组件
        playList.addVideoHotspot(nextVideoId)
      } else if (actItem.actionType == HotToState.JUMPTIME) {
        // 切进度
        kxplayer.setCurrentTime(actItem.jumpTime)
      }
    })
  })
}

function delHotspot(interactNodeId) {
  kxplayer.delAllHotspot()
  let list = kxplayer.getLayerArray()
  list.forEach((item) => {
    if (item.name.indexOf('tooltip_') != -1) {
      kxplayer.delLayer(item.name)
    }
  })

  let interactlist = playList.getVidioInteract(interactNodeId)
  interactlist.forEach((item) => {
    let interactInfoIdItem = item.interactInfoIdJson
    let metas = interactInfoIdItem?.interactConfigJson?.metas
    metas?.forEach((item) => {
      kxplayer.delLayer(item.name?.toLowerCase())
    })
  })
}
