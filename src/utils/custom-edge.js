/**
 * logicFlow 自定义边:http://logic-flow.org/guide/basic/edge.html
 */

import { PolylineEdge, PolylineEdgeModel } from '@logicflow/core'

class CustomModel extends PolylineEdgeModel {
  getEdgeStyle() {
    const style = super.getEdgeStyle()
    style.stroke = '#fff'

    return style
  }
}

class CustomView extends PolylineEdge {}

export default {
  type: 'custom-edge',
  view: CustomView,
  model: CustomModel,
}
