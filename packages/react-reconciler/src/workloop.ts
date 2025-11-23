import { beginWork } from "./beginWork";
import { completeWork } from "./completeWork";
import { createWorkInProgress, FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./workTags";
import { MutationMask, NoFlags } from "./fiberFlags";
import { commitMutationEffects } from "./commitWork";

// TODO：需要一个全局的指针，指向当时正在工作的 fiberNode 树，一般是 workInProgress
// 指向当前工作单元的指针
let workInProgress: FiberNode | null = null;

// 主要用于进行 更新的过程，那么可以推测出调用 renderRoot 应该是触发更新的 api
function renderRoot(root: FiberRootNode) {
  // 初始化，将workInProgress 指向第一个fiberNode
  prepareFreshStack(root.current);
  do {
    try {
      workLoop();
      break;
    } catch (error) {
      if (__DEV__) {
        console.warn("workLoop发生错误：", error);
      }
      workInProgress = null;
    }
  } while (true);
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  // 接下来实行 react-dom下的首屏渲染流程了
  // 从根节点开始，递归执行 commitWork
  commitRoot(root);
}

// scheduleUpdateOnFiber主要是找到hostFiberNode, 然后开始reconciler过程。
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

// prepareFreshStack函数： 用于初始化当前节点的wip， 并创建alternate 的双缓存的建立。
function prepareFreshStack(fiber: FiberNode) {
  workInProgress = createWorkInProgress(fiber, {});
}

// commitRoot函数： 用于执行 commit 阶段， 主要是执行 commitMutationEffects 函数， 然后更新 root.current 指向 finishedWork。
function commitRoot(root: FiberRootNode) {
  // root.finishedWork 为 workInProgress
  const finishedWork = root.finishedWork;
  if (finishedWork === null) {
    return;
  }
  if (__DEV__) {
    console.warn("commit阶段开始", finishedWork);
  }
  // 重置 finishedWork
  root.finishedWork = null;
  // 执行 commit 阶段
  // 判断是否存在子阶段需要执行的操作
  const subtreeHasEffects =
    (finishedWork.subtreeFlags & MutationMask) !== NoFlags;
  const rootHasEffects = (finishedWork.flags & MutationMask) !== NoFlags;

  if (subtreeHasEffects || rootHasEffects) {
    // beforeMutation
    // mutation Placement
    commitMutationEffects(finishedWork);
    root.current = finishedWork;
    // layout
  } else {
    root.current = finishedWork;
  }
}

// 该函数用于调度和执行 FiberNode 树的更新和渲染过程
// 该函数的作用是处理 React 程序中更新请求，计算 FiberNode 树中的每个节点的变化，并把这些变化同步到浏览器的DOM中
function workLoop() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

// 在这个函数中，React 会计算 FiberNode 节点的变化，并更新 workInProgress
// workInProgress 树构建过程是一个深度优先遍历（DFS）：
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
