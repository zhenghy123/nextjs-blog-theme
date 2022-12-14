/**
 * logicFlow 自定义节点:http://logic-flow.org/guide/basic/node.html
 */
import {
  HtmlNode,
  HtmlNodeModel,
  NodeConfig,
  EdgeConfig,
  h,
} from '@logicflow/core'

class CustomView extends HtmlNode {
  setHtml(rootEl) {
    const { properties } = this.props.model
    // console.log('properties', properties)

    const el = document.createElement('div')
    el.className = 'item-wrapper'
    const html = `
        <div class="item-body">
            <img class="poster" src="${properties.previewThumbnial}" onerror="this.src='assets/svgs/image-error.svg'" />
            <div class="text">${properties.filename}</div>
        </div>
    `
    el.innerHTML = html
    // 需要先把之前渲染的子节点清除掉。
    rootEl.innerHTML = ''
    rootEl.appendChild(el)
  }
}

class CustomNodeModel extends HtmlNodeModel {
  initNodeData(data) {
    super.initNodeData(data)

    // const style = super.getNodeStyle()
    // this.isSelected = true
    // console.log(this)
    this.width = 180
    this.height = 102
  }

  getOutlineStyle() {
    const style = super.getOutlineStyle()
    style.strokeDasharray = 'none'
    style.stroke = '#1890ff'
    style.hover.stroke = '#1890ff'
    style.strokeWidth = 3

    // console.log(style)
    return style
  }

  getDefaultAnchor() {
    const { height, x, y, id } = this
    return [
      {
        x: x,
        y: y + height / 2,
        name: 'top',
        id: `${id}_0`,
      },
      {
        x,
        y: y - height / 2,
        type: 'bottom',
        id: `${id}_1`,
      },
    ]
  }
}

export default {
  type: 'custom-node',
  view: CustomView,
  model: CustomNodeModel,
}
