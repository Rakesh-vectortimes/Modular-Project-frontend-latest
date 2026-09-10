import { RenderNode } from '../../../shared/renderer/render-node.model';

/** Builder canvas node — same shape as the shared render tree. */
export type BuilderNode = RenderNode;

export {
  nextTempNodeId,
  resetTempNodeIds,
  builderNodeFromRead,
  createNodeFromDefinition,
  toLayoutNodeWrite,
  findNodeById,
  findParentList,
  findParentNode,
  cloneTree,
  findInnermostContainerAt,
  getAbsolutePosition,
  isDescendantOf,
  socialLoginNodeHeight,
  socialLoginProviderCount,
  isSocialLoginNode,
  isLayoutRegion,
  snapLayoutRegionPosition,
  resyncNodesToViewport,
} from './builder-tree.utils';

export type { ContainerHit, LayoutFrame, LayoutRegion } from './builder-tree.utils';
