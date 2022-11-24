// 互动组件枚举
export const InteractiveEnums = {
  TextModule: {
    beforeTrigger: '/assets/imgs/pointClick/beforeTrigger.png',
    triggering: '/assets/imgs/pointClick/triggering.png',
    afterTrigger: '/assets/imgs/pointClick/afterTrigger.png',
  },

  PointClickModule: {
    beforeTrigger: '/assets/imgs/pointClick/beforeTrigger.png',
    triggering: '/assets/imgs/pointClick/triggering.png',
    afterTrigger: '/assets/imgs/pointClick/afterTrigger.png',
  },

  ClickGroupModule: {
    beforeTrigger: '/assets/imgs/optionsBranch/beforeTrigger.png',
    triggering: '/assets/imgs/optionsBranch/triggering.png',
    afterTrigger: '/assets/imgs/optionsBranch/afterTrigger.png',
  },

  ContinueClickMdule: {
    beforeTrigger: '/assets/imgs/combinationClick/beforeTrigger.png',
    triggering: '/assets/imgs/combinationClick/triggering.png',
    afterTrigger: '/assets/imgs/combinationClick/afterTrigger.png',
  },
}

// 枚举转换（兼容国标和制作工具）
export const enumTranslate = {
  TextModule: 'TextModule',
  PointClickModule: 'PointClickModule',
  ClickGroupModule: 'ClickGroupModule',
  ContinueClickMdule: 'ContinueClickMdule',
}
