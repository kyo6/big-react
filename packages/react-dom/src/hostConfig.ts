// 描述宿主方法环境的方法
import { FiberNode } from "react-reconciler/src/fiber";
import { HostComponent, HostText } from "react-reconciler/src/workTags";

export type Container = Element;
export type Instance = Element;
export type TextInstance = Text;

// createInstance 用于创建宿主环境的实例，比如浏览器环境下的 DOM 元素
// export const createInstance = (type: string, props: any):
export const createInstance = (type: string, props: any): Instance => {
  // TODO 处理 props
  const element = document.createElement(type);
  return element;
};

// 创建文本节点
export const createTextInstance = (content: string) => {
  return document.createTextNode(content);
};

// 插入子节点
export const appendInitialChild = (
  parent: Instance | Container,
  child: Instance
) => {
  parent.appendChild(child);
};

export const appendChildToContainer = appendInitialChild;
export const commitUpdate = (fiber: FiberNode) => {
  if (__DEV__) {
    console.log("执行 Update 操作", fiber);
  }
  switch (fiber.tag) {
    case HostComponent:
      // TODO
      break;
    case HostText:
      const text = fiber.memoizedProps.content;
      commitTextUpdate(fiber.stateNode, text);
      break;
    default:
      if (__DEV__) {
        console.warn("未实现的 commitUpdate 类型", fiber);
      }
  }
};

export const commitTextUpdate = (
  textInstance: TextInstance,
  content: string
) => {
  textInstance.textContent = content;
};

export const removeChild = (
  child: Instance | TextInstance,
  container: Container
) => {
  container.removeChild(child);
};
