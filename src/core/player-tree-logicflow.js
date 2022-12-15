import { changeClass, hasClass, format } from '../utils/utils'
import {
  LogicFlow,
  GraphConfigData,
  EdgeConfig,
  NodeConfig,
} from '@logicflow/core'
import '@logicflow/core/dist/style/index.css'
import '@logicflow/extension/lib/style/index.css'
import { omit, cloneDeep, isEmpty } from 'lodash-es'
import Hierarchy from '@antv/hierarchy'
import customEdge from '../utils/custom-edge'
import customNode from '../utils/custom-node'

export class PlayerTree {
  constructor(_parser, _player) {
    this._parser = _parser
    this._player = _player

    this.treeList = {}
    this.canvasPosition = {}
    this.treeClick = this.treeClick.bind(this)
    // this.windowResize = this.windowResize.bind(this)

    this.lf = null
    this.currentNodeId = null
  }

  init() {
    let dom = document.createElement('div')
    dom.className = 'nodetree hidden'
    dom.innerHTML = `
        <div class="project-name">${this._parser._json.drama.name}</div>
        <div class="close">
            <img src='./assets/svgs/close.svg'>
        </div>
        <div id="logic-container" class="logic"></div>
    `
    document.getElementById(this._player._options.id).appendChild(dom)

    this._player._emitter.on('treeShow', () => {
      this.handleTreeShow()
      this.renderLogicFlow()

      if (this._parser._playerControl._currentVideoId) {
        this.lf.getModelById(
          this._parser._playerControl._currentVideoId
        ).isSelected = true
      }
    })

    document
      .querySelector('.nodetree .close')
      .addEventListener('click', this.handleTreeClose)

    // window.addEventListener('resize', this.windowResize)

    this.getTreeData()
    this.initLogicFlow()
  }

  /**
   * 根据config中的ctrls和btns获取节点的层级关系
   * 注：skipVideoId是跳转节点，不包含在展示的树中（触发时单独处理）
   */
  getTreeData() {
    const findNextVideo = (id) => {
      let videoIds = []

      let videoItem = this._parser.getVideoItem(id)
      let ids = videoItem.interactNodeId
      let nodeList = ids?.map((nodeId) => this._parser.getNodeItem(nodeId))
      nodeList?.forEach((item) => {
        let interactInfoIdItem = item.interactInfoIdJson
        const { ctrls = [], btns = [] } = interactInfoIdItem?.interactConfigJson
        console.log('ctrls ', ctrls)
        ctrls?.forEach((ctrl) => {
          let conditionConfig = ctrl.conditionConfig
          let videoId = conditionConfig?.jumpVideoId
          if (videoId) {
            videoIds.push(videoId)
          }
        })
        btns?.forEach((btn) => {
          btn?.action?.forEach((actItem) => {
            let nextVideoId = actItem.nextVideo
            if (nextVideoId) {
              videoIds.push(nextVideoId)
            }
          })
        })
      })

      return [...new Set(videoIds)]
    }

    const dealData = (parent, id) => {
      let videoIds = findNextVideo(id)
      videoIds.forEach((item) => {
        let videoItem = this._parser.getVideoItem(item)
        if (videoItem) {
          let param = {
            ...videoItem,
            isRoot: false,
            id: videoItem?.videoId,
            children: [],
          }
          parent.children.push(param)
          dealData(param, videoItem.videoId)
        }
      })

      return parent
    }

    let id = this._parser._firstVideoId
    let videoItem = this._parser.getVideoItem(id)
    let rootVideo = {
      ...videoItem,
      isRoot: true,
      id: videoItem?.videoId,
      children: [],
    }
    dealData(rootVideo, id)

    this.treeList = rootVideo
  }

  initLogicFlow() {
    this.lf = new LogicFlow({
      container: document.querySelector('#logic-container'),
      adjustEdge: false,
      hoverOutline: false,
      edgeSelectedOutline: false,
      isSilentMode: true,
      autoExpand: false,
      background: {
        backgroundColor: '#00000082',
      },
    })

    this.lf.register(customEdge)
    this.lf.register(customNode)
    this.lf.setDefaultEdgeType('custom-edge')
    this.lf.setTheme({
      arrow: {
        offset: 0,
        verticalLength: 0,
      },
    })

    this.lf.on('node:click', ({ data }) => {
      console.log('node click:', data)

      setTimeout(() => {
        this._parser._playerControl.changeVideo(data.id)
        this.handleTreeClose()
      }, 300)
      //   if (data.properties.type) {
      // setSelectedNode(data.id, data.properties);
      //   }
    })
    this.lf.on('blank:drop', ({ data }) => {
      if (this._parser._playerControl._currentVideoId) {
        this.lf.getModelById(
          this._parser._playerControl._currentVideoId
        ).isSelected = true
      }
    })

    this.renderLogicFlow()
  }

  renderLogicFlow() {
    let gfdata = this.addPosToTree()
    this.lf.render(gfdata)

    // this.lf.focusOn({
    //   id: this._parser._firstVideoId,
    // })

    this.lf.focusOn({
      coordinate: {
        x: 200,
        y: 400,
      },
    })
  }

  /**
   * 通过Hierarchy插件给树添加坐标：采用垂直显示
   */
  addPosToTree() {
    const FIRST_ROOT_X = 200
    const FIRST_ROOT_Y = 200
    const NODE_SIZE = 102
    const PEM = 35
    const treeList = Hierarchy.compactBox(this.treeList, {
      direction: 'TB',
      getId(d) {
        return d.id
      },
      getHeight(d) {
        // if (d.isRoot) {
        //   return NODE_SIZE * 3
        // }
        return NODE_SIZE
      },
      getWidth(d) {
        // if (d.isRoot) {
        //   return 200 * 2 + PEM * 1.6
        // }
        return 200 + PEM * 1.6
      },
      getHGap(d) {
        // if (d.isRoot) {
        //   return PEM * 2
        // }
        return PEM
      },
      getVGap(d) {
        // if (d.isRoot) {
        //   return PEM * 2
        // }
        return PEM
      },
      getSubTreeSep(d) {
        if (!d.children || !d.children.length) {
          return 0
        }
        return PEM
      },
    })

    const x = this.treeList.x || FIRST_ROOT_X
    const y = this.treeList.y || FIRST_ROOT_Y
    const x1 = treeList.x
    const y1 = treeList.y
    const moveX = x - x1
    const moveY = y - y1

    const newTree = this.dfsTree(cloneDeep(treeList), (item) => {
      return {
        ...item,
        x: item.x + moveX,
        y: item.y + moveY,
        type: 'custom-node',
        properties: {
          previewThumbnial: item.data.previewThumbnial,
          filename: item.data.filename,
          depth: item.depth,
          id: item.data.id,
          parentId: item?.parent?.id ? item.parent.id : '',
          sourceEditData: omit(item.data, 'children', 'isRoot'),
          isRoot: !!item.data.isRoot,
          isChecked: false,
        },
      }
    })
    let gfdata = this.treeToGraph(newTree)

    // console.error(gfdata)

    return gfdata
  }

  windowResize() {
    this.lf.resize(
      document.getElementById(this._player._options.id).clientWidth,
      document.getElementById(this._player._options.id).clientHeight
    )
    this.renderLogicFlow()
    // this.getTreeData()
    // this.initLogicFlow()
  }

  isTreeShow() {
    return hasClass(document.querySelector('.nodetree'), 'show')
  }

  handleTreeShow() {
    changeClass(document.querySelector('.nodetree'), 'show', 'hidden')
  }

  handleTreeClose() {
    changeClass(document.querySelector('.nodetree'), 'hidden', 'show')
  }

  treeClick(ele) {
    let id = ele.path[1].dataset.id || ''
    this._parser._playerControl.changeVideo(id)
  }

  dfsTree(tree, callback) {
    const newTree = callback(tree)
    if (tree.children && tree.children.length > 0) {
      newTree.children = tree.children.map((treeNode) => {
        return this.dfsTree(treeNode, callback)
      })
    }
    return newTree
  }

  treeToGraph(rootNode) {
    const nodes = []
    const edges = []
    function getNode(current, parent) {
      const node = {
        ...omit(current, 'children'),
      }
      nodes.push(node)
      if (current.children) {
        current.children.forEach((subNode) => {
          getNode(subNode, node)
        })
      }
      if (parent) {
        const edge = {
          sourceNodeId: parent.id,
          targetNodeId: node.id,
          type: 'custom-edge',
          properties: {
            xx: 'xx',
          },
        }
        edges.push(edge)
      }
    }
    getNode(rootNode)
    return {
      nodes,
      edges,
    }
  }
}
