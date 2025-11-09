import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./workTags";

// TODO：需要一个全局的指针，指向当时正在工作的 fiberNode 树，一般是 workInProgress
// 指向当前工作单元的指针
let workInProgress: FiberNode | null = null;

// 调度功能
export function scheduleUpdateOnFiber(fiber: FiberNode) {
  const root = markUpdateFromFiberToRoot(fiber);
  renderRoot(root);
}

// 从触发更新的节点向上遍历到 FiberRootNode
function markUpdateFromFiberToRoot(fiber: FiberNode) {
  let node = fiber;
  while (node.return !== null) {
    node = node.return;
  }
  if (node.tag == HostRoot) {
    return node.stateNode;
  }
  return null;
}

// 用于进行初始化的操作
function prepareFreshStack(fiber: FiberNode) {
  workInProgress = createWorkInProgress(fiber, {});
}

// 主要用于进行 更新的过程，那么可以推测出调用 renderRoot 应该是触发更新的 api
function renderRoot(fiber: FiberRootNode) {
  prepareFreshStack(fiber.current);
  do {
    try {
      workLoop();
    } catch (error) {
      console.error(error);
    }
  } while (workInProgress !== null);
  return workInProgress;
}

// 该函数用于调度和执行 FiberNode 树的更新和渲染过程
// 该函数的作用是处理 React 程序中更新请求，计算 FiberNode 树中的每个节点的变化，并把这些变化同步到浏览器的DOM中
function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 在这个函数中，React 会计算 FiberNode 节点的变化，并更新 workInProgress
function performUnitOfWork(fiber: FiberNode) {
  const next = beginWork(fiber);
  // 递执行完之后，需要更新下工作单元的props
  fiber.memoizedProps = fiber.pendingProps;
  // 没有子节点的 FiberNode 了，代表递归到最深层了。
  if (next === null) {
    completeUnitOfWork(fiber);
  } else {
    // 如果有子节点的 FiberNode，则更新子节点为新的 fiberNode 继续执行
    workInProgress = next;
  }
}

// 主要进行归的过程，向上遍历父节点以及兄弟，更新它们节点的变化，并更新 workInProgress
function completeUnitOfWork(fiber: FiberNode) {
  let node = fiber;
  while (node !== null) {
    completeWork(node);
    if (node.sibling !== null) {
      workInProgress = node.sibling;
      return;
    } else if (node.return !== null) {
      node = node.return;
      workInProgress = node;
    } else {
      workInProgress = null;
    }
  }
}
