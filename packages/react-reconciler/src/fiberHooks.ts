import { Action } from "shared/ReactTypes";
import {
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
  processUpdateQueue,
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
  memoizedState: any; // 不同的 hook 有不同的状态
  updateQueue: unknown;
  next: Hook | null;
}

// 当前正在渲染的函数组件的 FiberNode 用于保存当前函数组件里面 使用的 hooks
let currentlyRenderingFiber: FiberNode | null = null;
// 更新的时候的数据来源
let currentHook: Hook | null = null;
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
    currentDispatcher.current = HooksDispatcherOnUpdate;
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

const HooksDispatcherOnUpdate: Dispatcher = {
  useState: updateState,
};

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
  hook.memoizedState = memoizedState;

  // NOTE：dispatch 方法是可以不在 FC 组件内部调用的
  // 通过bind预置 fiber 和 queue 信息，用户只需要传递 action
  // @ts-ignore
  const dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
  // 为queue添加dispatch方法
  // 向更新队列中添加更新时，会调用dispatch方法
  queue.dispatch = dispatch;

  return [memoizedState, dispatch];
}

function updateState<State>(): [State, Dispatch<State>] {
  const hook = updateWorkInProgressHook();
  // 计算新的state逻辑
  const queue = hook.updateQueue as UpdateQueue<State>;
  const pending = queue.shared.pending;
  if (pending !== null) {
    const { memoizedState } = processUpdateQueue(hook.memoizedState, pending);
    hook.memoizedState = memoizedState;
  }
  return [hook.memoizedState, queue.dispatch as Dispatch<State>];
}

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

/** 获取当前正在工作的 Hook */
function mountWorkInProgressHook(): Hook {
  // 不存在首先创建一个 hook 对象
  const hook: Hook = {
    memoizedState: null,
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

/** 找到当前正在工作的 useState，从 FiberNode的 memoizedState 中获取 Hook 的数据 */
function updateWorkInProgressHook() {
  // TODO render阶段触发的更新
  let nextCurrentHook: Hook | null;
  // FC update时的第一个hook
  if (currentHook === null) {
    // 获取 current FiberNode 的 memoizedState
    const current = currentlyRenderingFiber?.alternate;
    if (current !== null) {
      nextCurrentHook = current?.memoizedState;
    } else {
      nextCurrentHook = null;
    }
  } else {
    // FC update时候，后续的hook
    nextCurrentHook = currentHook.next;
  }

  if (nextCurrentHook === null) {
    // mount / update u1 u2 u3
    // update u1 u2 u3 u4
    throw new Error(
      `组件${currentlyRenderingFiber?.type}本次执行时的Hook比上次执行的多`
    );
  }

  currentHook = nextCurrentHook as Hook;
  const newHook: Hook = {
    memoizedState: currentHook.memoizedState,
    updateQueue: currentHook.updateQueue,
    next: null,
  };
  if (workInProgressHook === null) {
    // update时，第一个hook
    if (currentlyRenderingFiber === null) {
      throw new Error("请在函数组件内调用hook");
    } else {
      workInProgressHook = newHook;
      currentlyRenderingFiber.memoizedState = workInProgressHook;
    }
  } else {
    // update时，后续的hook
    workInProgressHook.next = newHook;
    workInProgressHook = newHook;
  }
  return workInProgressHook;
}
