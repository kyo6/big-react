import { ReactElementType } from "shared/ReactTypes";
import { reconcileChildFibers } from "./childFiber";
import { FiberNode } from "./fiber";
import { processUpdateQueue, UpdateQueue } from "./updateQueue";
import { HostComponent, HostRoot, HostText } from "./workTags";
// 递归中的递阶段

export const beginWork = (workInProgress: FiberNode) => {
  //  将当前 FiberNode 和 ReactElement 比较，返回子FiberNode
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(workInProgress);
    case HostComponent:
      return updateHostComponent(workInProgress);
    case HostText:
      return updateHostText();
    default:
      if (__DEV__) {
        console.warn("beginWork 未实现的类型", workInProgress.tag);
      }
      break;
  }
  return null;
};

function updateHostRoot(workInProgress: FiberNode) {
  // 根据当前节点和工作中节点的状态进行比较，处理属性等更新逻辑
  const baseState = workInProgress.memoizedState;
  const updateQueue = workInProgress.updateQueue as UpdateQueue<Element>;
  const pending = updateQueue.shared.pending;
  // 清空更新链表
  updateQueue.shared.pending = null;
  // 计算待更新状态的最新值
  const { memoizedState } = processUpdateQueue(baseState, pending);
  workInProgress.memoizedState = memoizedState;

  // 为什么nextChildren是workInProgress.memoizedState？
  // 因为workInProgress.memoizedState是更新后的状态，所以需要将更新后的状态作为子节点的 ReactElement
  const nextChildren = workInProgress.memoizedState;
  reconcileChildren(workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
  const nextProps = workInProgress.pendingProps;
  const nextChildren = nextProps.children;
  reconcileChildren(workInProgress, nextChildren);
  return workInProgress.child;
}

function updateHostText() {
  // 没有子节点，直接返回 null
  return null;
}

// 对比子节点的 current FiberNode 与 子节点的 ReactElement
// 生成子节点对应的 workInProgress FiberNode
function reconcileChildren(
  workInProgress: FiberNode,
  nextChildren?: ReactElementType
) {
  // alternate 指向节点的备份节点，即 current
  const current = workInProgress.alternate;
  if (current !== null) {
    // update阶段，复用 current FiberNode，更新其 props
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current?.child,
      nextChildren
    );
  } else {
    // mount
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      null,
      nextChildren
    );
  }
}
