import { Action } from "shared/ReactTypes";

export type Dispatch<State> = (action: Action<State>) => void;
// const [data, setData] = useState(0);
// const [data, setData] = useState((data) => data + 1);
export interface Dispatcher {
  useState: <S>(initialState: (() => S) | S) => [S, Dispatch<S>];
}

const currentDispatcher: { current: Dispatcher | null } = {
  current: null,
};

export const resolveDispatcher = (): Dispatcher => {
  const dispatcher = currentDispatcher.current;
  if (dispatcher == null) {
    throw new Error("Hooks 只能在函数组件中执行");
  }
  return dispatcher;
};

export default currentDispatcher;
