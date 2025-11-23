import { FiberNode, FiberRootNode } from "./fiber";
import { MutationMask, NoFlags, Placement } from "./fiberFlags";
import { HostComponent, HostRoot, HostText } from "./workTags";
import { appendChildToContainer, Container } from "hostConfig";

// 保存下一个需要执行的effecct 节点
let nextEffect: FiberNode | null = null;

// commitMutationEffects
// commitMutationEffects 函数负责深度优先遍历 Fiber 树，递归地向下寻找子节点是否存在 Mutation 阶段需要执行的 flags，
// 如果遍历到某个节点，其所有子节点都不存在 flags（即 subtreeFlags == NoFlags），则停止向下，
// 调用 commitMutationEffectsOnFiber 处理该节点的 flags，并且开始遍历其兄弟节点和父节点。
export const commitMutationEffects = (finishedWork: FiberNode) => {
  nextEffect = finishedWork;
  // 深度优先遍历 Fiber 树，寻找更新 flags
  while (nextEffect !== null) {
    // 向下遍历
    const child: FiberNode | null = nextEffect.child;

    if (
      (nextEffect.subtreeFlags & MutationMask) !== NoFlags &&
      child !== null
    ) {
      // 如果有子节点，且子节点有副作用，则将子节点作为下一个需要执行的effect节点
      nextEffect = child;
      continue;
    } else {
      // 如果没有子节点，或者子节点没有副作用(也就是说不是叶子节点，可能遇到第一个没有subtreeFlags的节点)，则当前节点可能存在 Flags，有的话需要执行副作用
      // 向上遍历
      up: while (nextEffect !== null) {
        // 如果当前节点有副作用，则执行副作用
        commitMutationEffectsOnFiber(nextEffect);

        const sibling: FiberNode | null = nextEffect.sibling;
        // 遍历兄弟节点
        if (sibling !== null) {
          nextEffect = sibling;
          break up;
        }
        // 如果没有兄弟节点，且父节点有副作用，则将父节点作为下一个需要执行的effect节点
        nextEffect = nextEffect.return;
      }
    }
  }
};

export const commitMutationEffectsOnFiber = (finishedWork: FiberNode) => {
  const { flags } = finishedWork;
  if ((flags & Placement) !== NoFlags) {
    commitPlacement(finishedWork);
    // 将 Placement 标记从 finishedWork当前工作的节点中 清除
    finishedWork.flags &= ~Placement;
    // flags Update
    // flags ChildDeletion
  }
};

// commitPlacement 函数主要用来完成真实的dom节点的插入、删除和更新等操作。
export const commitPlacement = (finishedWork: FiberNode) => {
  if (__DEV__) {
    console.warn("执行commitPlacement操作", finishedWork);
  }
  // 需要获取 parentFiber Dom节点
  // 需要获取 finishedWork Dom节点
  // parentDom 插入 finishWork对应的dom
  const parentNode = getParentNode(finishedWork);
  if (parentNode !== null) {
    appendPlacementNodeIntoContainer(finishedWork, parentNode);
  }
};

export const getParentNode = (fiber: FiberNode): Container | null => {
  let parent = fiber.return;
  while (parent !== null) {
    if (parent.tag === HostComponent) {
      return parent.stateNode as Container;
    } else if (parent.tag === HostRoot) {
      return (parent.stateNode as FiberRootNode).container;
    }
    parent = parent.return;
  }
  if (__DEV__) {
    console.warn("未找到 host parent", fiber);
  }
  return null;
};

export const appendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  parentNode: Container
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    appendChildToContainer(parentNode, finishedWork.stateNode);
    return;
  } else if (finishedWork.child !== null) {
    let child = finishedWork.child;
    while (child !== null) {
      appendPlacementNodeIntoContainer(child, parentNode);
      let sibling = child.sibling;
      while (sibling !== null) {
        appendPlacementNodeIntoContainer(sibling, parentNode);
        sibling = sibling.sibling;
      }
    }
  }
};
