import { ReactElementType } from "shared/ReactTypes";
import { reconcileChildFibers } from "./childFiber";
import { FiberNode } from "./fiber";
import { processUpdateQueue, UpdateQueue } from "./updateQueue";
import { HostComponent, HostRoot, HostText } from "./workTags";
// 递归中的递阶段

/**
 * 在 beginWork() 中，会：
 * 1.	计算新的 props / state；
 * 2.	执行函数组件（FunctionComponent）；
 * 3.	调用 reconcileChildren(currentFiber, newElements) 生成新的子 Fiber；
 * 4.	形成 workInProgress 子树。
 **/

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
  const newElements = workInProgress.memoizedState;
  reconcileChildren(workInProgress, newElements);
  return workInProgress.child;
}

function updateHostComponent(workInProgress: FiberNode) {
  const nextProps = workInProgress.pendingProps;
  const newElements = nextProps.children;
  reconcileChildren(workInProgress, newElements);
  return workInProgress.child;
}

function updateHostText() {
  // 没有子节点，直接返回 null
  return null;
}

// 基于 current.child 对比生成新 Fiber
function reconcileChildren(
  workInProgress: FiberNode,
  newElements?: ReactElementType
) {
  // alternate 指向节点的备份节点，即 current
  const current = workInProgress.alternate;
  if (current !== null) {
    // update阶段，复用 current FiberNode，更新其 props.
    // reconcileChildFibers这个函数主要是根据wip和它的子元素的ReactElement去生成对应子fiberNode，其中current?.child为上一次渲染的值。children为子的ReactElement对象。
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current?.child,
      newElements
    );
  } else {
    // mount
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      null,
      newElements
    );
  }
}
