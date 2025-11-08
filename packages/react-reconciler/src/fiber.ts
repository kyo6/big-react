import { Props, Key, Ref } from "shared/ReactTypes";
import { WorkTag } from "./workTag";
import { Flags, NoFlags } from "./fiberFlags";
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

  memoizedProps: Props | null;
  // 双缓冲树的切换
  alternate: FiberNode | null;
  // fiberNode 双缓冲树对比之后产生的标记，比如插入，移动，删除等
  flags: Flags;

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
  }
}
