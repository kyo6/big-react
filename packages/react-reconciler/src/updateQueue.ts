import { Action } from "shared/ReactTypes";
import { Dispatch } from "react/src/currentDispatcher";

/** 定义 Update 数据结构，表示一个更新操作 */
export interface Update<State> {
  action: Action<State>;
}

/**
 * 定义 UpdateQueue 数据结构，表示一个更新队列
 */
export interface UpdateQueue<State> {
  shared: {
    pending: Update<State> | null;
  };
  dispatch: Dispatch<State> | null;
}

/**
 * 创建 Update 数据结构，表示一个更新操作
 * @param action
 * @returns Update<State>
 */
export const createUpdate = <State>(action: Action<State>): Update<State> => {
  return {
    action,
  };
};

/**
 * 创建 UpdateQueue 数据结构，表示一个更新队列
 * @param <State>
 * @returns UpdateQueue<State>
 */
export const createUpdateQueue = <State>(): UpdateQueue<State> => {
  return {
    shared: {
      pending: null,
    },
    dispatch: null, // 用于保存hook的dispatch
  };
};

/**
 * 将 Update 添加到 UpdateQueue 中
 * @param updateQueue
 * @param update
 * @returns
 */
export const enqueueUpdate = <State>(
  updateQueue: UpdateQueue<State>,
  update: Update<State>
) => {
  updateQueue.shared.pending = update;
};

/**
 * 处理 UpdateQueue 中的 update 队列，返回最新的 state
 * @param baseState
 * @param pendingUpdate
 * @returns
 */
export const processUpdateQueue = <State>(
  baseState: State,
  pendingUpdate: Update<State> | null
): { memoizedState: State } => {
  const result: ReturnType<typeof processUpdateQueue<State>> = {
    memoizedState: baseState,
  };
  if (pendingUpdate !== null) {
    const action = pendingUpdate.action;
    if (action instanceof Function) {
      result.memoizedState = action(baseState);
    } else {
      result.memoizedState = action;
    }
  }
  return result;
};
