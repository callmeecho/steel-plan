# src_v2

`src_v2` 是当前项目的平行版本工作区，用来承接新的工业化前端方案。

## 目标

- 保留现有 `src` 版本不动，确保当前可用界面不受影响
- 在 `src_v2` 中探索新的视觉语言、页面结构与业务表达
- 围绕中板组坯优化系统的真实业务，重做信息架构与结果呈现

## 当前已完成

- 复制了现有 `src`、`components`、`lib` 结构
- 为 `src_v2/app` 建立独立的 `layout.tsx`
- 为 `src_v2/app` 建立新的深色工业风 `globals.css`
- 重做了 `src_v2/app/page.tsx` 首页壳子

## 后续建议

- 优先改造 `src_v2/app/orders/page.tsx`
- 接着改造 `src_v2/app/planning/page.tsx`
- 最后统一导航、状态条、结果页视觉
