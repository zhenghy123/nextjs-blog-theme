import { changeClass, format } from '../utils/utils'

export class PlayerTree {
  constructor(_parser, _player) {
    this._parser = _parser
    this._player = _player

    this.treeList = {}
    this.treeClick = this.treeClick.bind(this)
  }

  init() {
    this.initTreeList()
    this.createEle()

    this._player._emitter.on('treeShow', this.handleTreeShow)
  }

  handleTreeShow() {
    changeClass(document.querySelector('.nodetree'), 'show', 'hidden')
  }

  handleTreeClose() {
    changeClass(document.querySelector('.nodetree'), 'hidden', 'show')
  }

  createEle() {
    let nodeList = this.treeList
    let ele = {}
    ele = `
      <div class="processDesign">
        <div class="process">
          <div class="rootNode" data-id="${nodeList.id}">
            <img src="${
              nodeList.img
            }" onerror="this.src='./assets/error.jpeg'"></img>
            <p >${nodeList.label}</p>
          </div>
        </div>
        ${setnodelist(nodeList.children, 'root').join('')}
      </div>
      <div class="close">
          <img src='./assets/svgs/close.svg'>
      </div>
    `

    function setnodelist(childrenList, type) {
      if (childrenList && childrenList.length >= 1) {
        let list = []
        list.push(
          `<div class="nodewrap">
              <div class="nodeport">
                ${setnodeItemlist(childrenList).join('')}
              </div>
            </div>`
        )
        return list
      } else {
        return ''
      }
    }

    function setnodeItemlist(list) {
      let eleItem = []
      list?.map((item, i) => {
        eleItem.push(
          `
          <div  class="nodeItem" :class="${
            item?.length > 1 ? 'nodeItems' : ''
          }">
            <div class="nodeType">
              <div class="nodeInfo" data-id="${item.id}">
                <img src="${
                  item.img
                }" onerror="this.src='./assets/error.jpeg'"></img>
                <p > ${item.label}</p>
              </div>
            </div>
            ${setnodelist(item.children)}
          </div>
          `
        )
      })
      return eleItem
    }

    let dom = document.createElement('div')
    dom.className = 'nodetree hidden'
    dom.innerHTML = ele
    document.getElementById('krpanoSWFObject').appendChild(dom)

    let infoList = document.getElementsByClassName('nodeInfo')
    for (let i = 0; i < infoList.length; i++) {
      infoList[i].addEventListener('click', this.treeClick)
    }

    document
      .querySelector('.rootNode')
      .addEventListener('click', this.treeClick)

    document
      .querySelector('.nodetree .close')
      .addEventListener('click', this.handleTreeClose)
  }

  treeClick(ele) {
    let id = ele.path[1].dataset.id || ''
    this._parser._playerControl.changeVideo(id)
  }

  initTreeList() {
    let id = this._parser._firstVideoId
    let rootVideo = this._parser.getVideoItem(id)
    let rootParam = {
      label: rootVideo?.filename,
      id: rootVideo?.videoId,
      img: rootVideo?.thumbnail
        ? this._parser._assetsPrefix + rootVideo?.thumbnail.replace('../', '')
        : '',
      children: [],
    }
    
    this.pathTree(rootParam, id)
    this.treeList = rootParam
  }

  pathTree(paramList, id) {
    let nextid = this.pathTreeClick(id)
    nextid.forEach((item) => {
      let rootVideo = this._parser.getVideoItem(item)
      if (rootVideo) {
        let param = {
          label: rootVideo?.filename,
          id: rootVideo?.videoId,
          img: rootVideo?.thumbnail
            ? this._parser._assetsPrefix +
              rootVideo?.thumbnail.replace('../', '')
            : '',
          children: [],
        }
        paramList.children.push(param)
        this.pathTree(param, item)
      }
    })
  }

  pathTreeClick(id) {
    let treeList = []
    let list = []
    let interactNodeId = this._parser.getVideoItem(id)?.interactNodeId
    let ids = interactNodeId
    ids?.map((id) => {
      let item = this._parser.getNodeItem(id)
      list.push(item)
    })
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
