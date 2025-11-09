// packages/react-reconciler/src/fiberReconciler.ts
// 实现 mount 时调用的 API, CreateContainer和updateContainer是两个主要的API
// 将该 API 接入上述更新机制中，将updateQueue接入到fiberNode中
import { Container } from "hostConfig";
import { FiberNode, FiberRootNode } from "./fiber";
import { HostRoot } from "./workTags";
import {
  UpdateQueue,
  createUpdate,
  createUpdateQueue,
  enqueueUpdate,
} from "./updateQueue";
import { ReactElementType } from "shared/ReactTypes";
import { scheduleUpdateOnFiber } from "./workloop";

/**
 * createRoot方法执行时，调用createContainer方法，创建FiberRootNode
 * @param container 容器
 * @returns FiberRootNode
 */
export function createContainer(container: Container) {
  const hostRootFiber = new FiberNode(HostRoot, {}, null);
  const root = new FiberRootNode(container, hostRootFiber);
  // 创建更新队列
  hostRootFiber.updateQueue = createUpdateQueue();
  return root;
}

/**
 * 组件render或者setState时调用的API
 * @param element 新的ReactElement
 * @param root 根fiberRoot
 * @returns ReactElement
 */
export function updateContainer(
  element: ReactElementType | null,
  root: FiberRootNode
) {
  const hostRootFiber = root.current;
  const update = createUpdate<ReactElementType | null>(element);
  //将该 API 接入上述更新机制中
  enqueueUpdate(
    hostRootFiber.updateQueue as UpdateQueue<ReactElementType | null>,
    update
  );
  scheduleUpdateOnFiber(hostRootFiber);
  return element;
}
