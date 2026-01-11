import { FiberNode, FiberRootNode } from "./fiber";
import {
  MutationMask,
  NoFlags,
  Placement,
  Update,
  ChildDeletion,
} from "./fiberFlags";
import {
  FunctionComponent,
  HostComponent,
  HostRoot,
  HostText,
} from "./workTags";
import {
  appendChildToContainer,
  insertChildToContainer,
  Container,
  Instance,
  commitUpdate,
  removeChild,
} from "hostConfig";

// 保存下一个需要执行的effecct 节点
let nextEffect: FiberNode | null = null;

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
  if ((flags & Update) !== NoFlags) {
    commitUpdate(finishedWork);
    finishedWork.flags &= ~Update;
  }
  if ((flags & ChildDeletion) !== NoFlags) {
    const deletions = finishedWork.deletions;
    if (deletions !== null) {
      deletions.forEach((childToDelete) => {
        commitDeletion(childToDelete);
      });
    }
    finishedWork.flags &= ~ChildDeletion;
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
  const hostParent = getHostParent(finishedWork);
  // host sibling
  const sibling = getHostSibling(finishedWork);

  if (hostParent !== null) {
    appendPlacementNodeIntoContainer(finishedWork, hostParent);
  }
};

// 获取兄弟 Host 节点
const getHostSibling = (fiber: FiberNode) => {
  let node: FiberNode = fiber;
  findSibling: while (true) {
    // 没有兄弟节点时，向上遍历
    while (node.sibling == null) {
      const parent = node.return;
      if (
        parent == null ||
        parent.tag == HostComponent ||
        parent.tag == HostRoot
      ) {
        return null;
      }
      node = parent;
    }

    // 向下遍历
    node.sibling.return = node.return;
    node = node.sibling;
    while (node.tag !== HostText && node.tag !== HostComponent) {
      // 不稳定的 Host 节点不能作为目标兄弟 Host 节点
      if ((node.flags & Placement) !== NoFlags) {
        continue findSibling;
      }
      if (node.child == null) {
        continue findSibling;
      } else {
        node.child.return = node;
        node = node.child;
      }
    }

    if ((node.flags & Placement) == NoFlags) {
      return node.stateNode;
    }
  }
};

// 获取 parent DOM
export const getHostParent = (fiber: FiberNode): Container | null => {
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

const appendPlacementNodeIntoContainer = (
  finishedWork: FiberNode,
  hostParent: Container,
  before?: Instance
) => {
  if (finishedWork.tag === HostComponent || finishedWork.tag === HostText) {
    if (before) {
      // 执行移动操作
      insertChildToContainer(finishedWork.stateNode, hostParent, before);
    } else {
      // 执行插入操作
      appendChildToContainer(finishedWork.stateNode, hostParent);
    }
  } else {
    const child = finishedWork.child;
    if (child !== null) {
      appendPlacementNodeIntoContainer(child, hostParent);
      let sibling = child.sibling;
      while (sibling !== null) {
        appendPlacementNodeIntoContainer(sibling, hostParent);
        sibling = sibling.sibling;
      }
    }
  }
};

// 删除节点及其子树
const commitDeletion = (childToDelete: FiberNode) => {
  if (__DEV__) {
    console.log("执行 Deletion 操作", childToDelete);
  }

  // 子树的根节点
  let rootHostNode: FiberNode | null = null;
  // 递归子树
  commitNestedComponent(childToDelete, (unmountFiber) => {
    switch (unmountFiber.tag) {
      case HostComponent:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        // TODO: 解绑ref
        return;
      case HostText:
        if (rootHostNode === null) {
          rootHostNode = unmountFiber;
        }
        return;
      case FunctionComponent:
        // TODO: useEffect unmount 解绑ref
        return;
      default:
        if (__DEV__) {
          console.warn("未处理的unmount类型", unmountFiber);
        }
        break;
    }
  });
  // 移除rootHostNode的DOM
  if (rootHostNode !== null) {
    const hostParent = getHostParent(childToDelete);
    if (hostParent !== null) {
      removeChild((rootHostNode as FiberNode).stateNode, hostParent);
    }
  }

  childToDelete.return = null;
  childToDelete.child = null;
};

// 深度优先遍历 Fiber 树，执行 onCommitUnmount
const commitNestedComponent = (
  root: FiberNode,
  onCommitUnmount: (unmountFiber: FiberNode) => void
) => {
  let node = root;
  while (true) {
    onCommitUnmount(node);

    // 向下遍历，递
    if (node.child !== null) {
      node.child.return = node;
      node = node.child;
      continue;
    }
    // 终止条件
    if (node === root) return;

    // 向上遍历，归
    while (node.sibling === null) {
      // 终止条件
      if (node.return == null || node.return == root) return;
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
};
