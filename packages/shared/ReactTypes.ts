export type Type = any;
export type Key = any;
export type Ref = any;
export type Props = any;
export type ElementType = any;

export interface ReactElementType {
  $$typeof: symbol | number;
  type: ElementType;
  key: Key;
  props: Props;
  ref: Ref;
  _mark: string;
}

// 定义 Action type
// this.setState(action) 或者 this.setState((prevState) => ({...prevState, ...newState}))
export type Action<State> = State | ((prevState: State) => State);
