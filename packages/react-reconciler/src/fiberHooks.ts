import { Action } from "shared/ReactTypes";
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  UpdateQueue,
} from "./updateQueue";
import { Dispatcher, Dispatch } from "react/src/currentDispatcher";
import { FiberNode } from "./fiber";
import internals from "shared/internals";

import { scheduleUpdateOnFiber } from "./workloop";

const { currentDispatcher } = internals;

// 定义一个通用的 Hooks 类型，满足所有 Hooks 的使用
// 满足 useState useEffect useReducer 等等
interface Hook {
  memoizedSate: any; // 不同的 hook 有不同的状态
  updateQueue: unknown;
  next: Hook | null;
}

// 当前正在渲染的函数组件的 FiberNode 用于保存当前函数组件里面 使用的 hooks
let currentlyRenderingFiber: FiberNode | null = null;

// 当前正在使用的 hook
let workInProgressHook: Hook | null = null;
/**
 * 生成函数组件的子FiberNode
 * @param wip 当前工作的 FiberNode 节点
 */
export function renderWithHooks(wip: FiberNode) {
  // 赋值
  currentlyRenderingFiber = wip;
  wip.memoizedState = null;

  // 判断时机
  const current = wip.alternate;
  if (current !== null) {
    // update
    // currentDispatcher.current = HooksDispatcherOnUpdate;
  } else {
    // mount
    currentDispatcher.current = HooksDispatcherOnMount;
  }

  // 1. 获取当前组件的类型
  const Component = wip.type;
  // 2. 获取当前组件的 props
  const props = wip.pendingProps;
  // 3. 获取当前组件的 hooks
  const children = Component(props);

  // 重置操作
  currentlyRenderingFiber = null;
  workInProgressHook = null;

  return children;
}

const HooksDispatcherOnMount: Dispatcher = {
  useState: mountState,
};

// const HooksDispatcherOnUpdate: Dispatcher = {
// 	useState: updateState
// };

function dispatchSetState<State>(
  fiber: FiberNode,
  updateQueue: UpdateQueue<State>,
  action: Action<State>
) {
  // 和接入首屏渲染的 update 流程相似
  // 生成 update
  const update = createUpdate(action);
  // 将 update 添加到 updateQueue 中
  enqueueUpdate(updateQueue, update);
  // 调度更新
  scheduleUpdateOnFiber(fiber);
}

function mountState<State>(
  initialState: (() => State) | State
): [State, Dispatch<State>] {
  const hook = mountWorkInProgressHook();
  let memoizedState;
  if (initialState instanceof Function) {
    memoizedState = initialState();
  } else {
    memoizedState = initialState;
  }
  const queue = createUpdateQueue<State>();
  hook.updateQueue = queue;
  // 为hook添加memoizedState
  hook.memoizedSate = memoizedState;

  // NOTE：dispatch 方法是可以不在 FC 组件内部调用的
  // 这里预置了 fiber 和 queue 信息，用户只需要传递 action
  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  // 为queue添加dispatch方法
  // 向更新队列中添加更新时，会调用dispatch方法
  queue.dispatch = dispatch;

  return [memoizedState, dispatch];
}

/** 获取当前正在工作的 Hook */
function mountWorkInProgressHook(): Hook {
  // 不存在首先创建一个 hook 对象
  const hook: Hook = {
    memoizedSate: null,
    updateQueue: null,
    next: null,
  };
  // hook 为空，说明是第一次使用
  if (workInProgressHook == null) {
    // mount 时的第一个hook
    if (currentlyRenderingFiber !== null) {
      workInProgressHook = hook;
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    } else {
      // currentlyRenderingFiber == null 代表 Hook 执行的上下文不是一个函数组件
      throw new Error("Hooks 只能在函数组件中执行");
    }
  } else {
    // mount 时的其他 hook
    // 将当前工作的 Hook 的 next 指向新建的 hook，形成 Hooks 链表
    workInProgressHook.next = hook;
    // 更新当前工作的 Hook
    workInProgressHook = hook;
  }

  return workInProgressHook;
}
