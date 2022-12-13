// 互动组件枚举
export const InteractiveEnums = {
  TextModule: {
    beforeTrigger: './assets/imgs/pointClick/beforeTrigger.png',
    triggering: './assets/imgs/pointClick/triggering.png',
    afterTrigger: './assets/imgs/pointClick/afterTrigger.png',
  },

  PointClickModule: {
    beforeTrigger: './assets/imgs/pointClick/beforeTrigger.png',
    triggering: './assets/imgs/pointClick/triggering.png',
    afterTrigger: './assets/imgs/pointClick/afterTrigger.png',
  },

  ClickGroupModule: {
    beforeTrigger: './assets/imgs/optionBranch/beforeTrigger.png',
    triggering: './assets/imgs/optionBranch/triggering.png',
    afterTrigger: './assets/imgs/optionBranch/afterTrigger.png',
  },

  ContinueClickMdule: {
    beforeTrigger: './assets/imgs/combinationClick/beforeTrigger.png',
    triggering: './assets/imgs/combinationClick/triggering.png',
    afterTrigger: './assets/imgs/combinationClick/afterTrigger.png',
  },
}

// 枚举转换（兼容国标和制作工具）
export const enumTranslate = {
  TextModule: 'TextModule',
  PointClickModule: 'PointClickModule',
  ClickGroupModule: 'ClickGroupModule',
  ContinueClickMdule: 'ContinueClickMdule',
}

// 热点跳转状态
export const HotToState = {
  HIDE: 'hide',
  CountDown: 'countDown',
  SWITCHVIDEO: 'SWITCHVIDEO',
  JUMPTIME: 'JUMPTIME',
  FACTOR: 'FACTOR',
}

// order: 有序式；disorder: 无序式
export const CompoundOrder = {
  ORDER: 'order',
  DISORDER: 'disorder',
}

// 0: 2D; 1: VR
export const VideoType = {
  PLANE: 0,
  VR: 1,
}
