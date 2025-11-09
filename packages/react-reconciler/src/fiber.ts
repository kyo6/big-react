import { Props, Key, Ref } from "shared/ReactTypes";
import { WorkTag } from "./workTags";
import { Flags, NoFlags } from "./fiberFlags";
import { Container } from "hostConfig"; //在tsconfig.json中配置了路径别名，因为不同的宿主环境有不同的实现，后期会单独抽离出一个包来实现不同的宿主环境
// ReactElement 对象的每个节点都会生成与之对应的 FiberNode
// React针对不同的 ReactElement 对象会产生不同tag（种类）的 FiberNode
// fiber.ts 存放 FiberNode 的数据结构
export class FiberNode {
  // 跟自身有关的属性
  type: any;
  tag: WorkTag;
  pendingProps: Props;
  key: Key;
  ref: Ref;
  stateNode: any;

  // 跟工作单元其它节点有关的属性
  return: FiberNode | null;
  sibling: FiberNode | null;
  child: FiberNode | null;
  index: number;

  memoizedProps: Props | null; // 经过reconcile之后的props
  memoizedState: any; // 经过reconcile之后的state
  updateQueue: unknown; // 更新队列

  // 双缓冲树的切换
  alternate: FiberNode | null;
  // fiberNode 双缓冲树对比之后产生的标记，比如插入，移动，删除等
  flags: Flags;

  /**
   * 构造函数
   * @param tag 工作标签
   * @param pendingProps 新的属性对象
   * @param key 键
   */
  constructor(tag: WorkTag, pendingProps: Props, key: Key) {
    this.tag = tag;
    this.key = key;
    this.stateNode = null; // dom引用
    this.type = null; // 组件本身  FunctionComponent () => {}

    this.ref = null;

    // fiber 除了有自身实例上的属性，还需要有表示和其它节点的关系
    this.return = null; // 指向父fiberNode
    this.sibling = null; // 兄弟节点
    this.child = null; // 子节点
    this.index = 0; // <li>1</li> <li>2</li> 表示它的序号

    // 作为工作单元
    this.pendingProps = pendingProps; // 刚开始工作阶段的 props
    this.memoizedProps = null; // 经过reconcile之后的props

    // 用于 current Fiber树和 workInProgress Fiber树的切换（如果当时fiberNode树是current树，则alternate指向的是workInProgress树）
    this.alternate = null;
    this.flags = NoFlags; // 初始状态时表示没有任何标记（因为还没进行fiberNode对比）
    this.updateQueue = null; // 更新队列
    this.memoizedState = null; // 经过reconcile之后的state
  }
}

export class FiberRootNode {
  container: Container;
  current: FiberNode;
  finishedWork: FiberNode | null;
  /**
   * FiberRootNode 的构造函数
   * @param container 容器
   * @param hostRootFiber 根fiberNode
   */
  constructor(container: Container, hostRootFiber: FiberNode) {
    this.container = container;
    this.current = hostRootFiber;
    // 将根节点的 stateNode 属性指向 FiberRootNode，用于表示整个 React 应用的根节点
    hostRootFiber.stateNode = this;
    // 指向更新完成之后的 hostRootFiber
    this.finishedWork = null;
  }
}

/**
 * workInProgress Fiber表示渲染阶段正在处理的组件
 * 双缓存树，该函数主要用来创建或复用一个workInProgress Fiber对象
 * @param current 当前的Fiber对象
 * @param pendingProps 新的属性对象
 * @returns
 */
export const createWorkInProgress = (
  current: FiberNode,
  pendingProps: Props
): FiberNode => {
  let wip = current.alternate;

  if (wip === null) {
    // mount阶段
    wip = new FiberNode(current.tag, pendingProps, current.key);
    // 创建一个新的 Fiber对象（HostFiberNode，例如根元素 div），并复制current的属性和标记
    wip.type = current.type;
    wip.stateNode = current.stateNode;

    wip.alternate = current;
    current.alternate = wip;
  } else {
    // update阶段
    // 复用，更新属性标记
    wip.pendingProps = pendingProps;
  }
  // 清除副作用，可能是上一次更新遗留下来的
  wip.flags = NoFlags;
  wip.updateQueue = current.updateQueue;
  wip.child = current.child;
  wip.memoizedProps = current.memoizedProps;
  wip.memoizedState = current.memoizedState;

  return wip;
};
