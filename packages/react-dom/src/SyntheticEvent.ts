import { Container } from "hostConfig";
import { Props } from "shared/ReactTypes";

export const elementPropsKey = "__props";
const validEventTypeList = ["click"];

type EventCallback = (e: Event) => void;

interface Paths {
  capture: EventCallback[];
  bubble: EventCallback[];
}

interface SyntheticEvent extends Event {
  __stopPropagation: boolean;
}

export interface DOMElement extends Element {
  [elementPropsKey]: Props;
}

export function updateFiberProps(node: DOMElement, props: Props) {
  // dom.__props = reactElement props
  node[elementPropsKey] = props;
}

export function initEvent(container: Container, eventType: string) {
  if (!validEventTypeList.includes(eventType)) {
    console.warn("initEvent 未实现的事件类型", eventType);
    return;
  }
  if (__DEV__) {
    console.log("初始化事件", eventType);
  }
  container.addEventListener(eventType, (e: Event) => {
    dispatchEvent(container, eventType, e);
  });
}

/**
 * 所以`dispatchEvent`的主要流程分为下面 4 步骤：

1.  收集沿途的绑定事件（`onClick`或者`onClickCapture`冒泡或捕获）
2.  基于原始事件参数`event`构造合成事件参数
3.  遍历捕获`capture`，依次执行
4.  遍历冒泡`bubble`，依次执行

 * @param container 
 * @param eventType 
 * @param e 
 */
function dispatchEvent(container: Container, eventType: string, e: Event) {
  const targetElement = e.target;
  if (targetElement === null) {
    console.warn("事件不存在target", e);
    return;
  }
  // 1. 收集沿途的事件
  const { bubble, capture } = collectPaths(
    targetElement as DOMElement,
    container,
    eventType
  );
  // 2. 基于原始事件参数`event`构造合成事件参数
  const se = createSyntheticEvent(e);

  // 3. 遍历capture
  triggerEventFlow(capture, se);
  // 4. bubble
  if (!se.__stopPropagation) {
    triggerEventFlow(bubble, se);
  }
}

/**
 *
 * @param targetElement `collectPaths`这个函数主要是收集从实际点击的`Dom元素`到`container`的绑定事件。接收三个函数
 *
 *  1.  `targetElement`: 点击的目标元素`e.target`
 *  2.  `container`: 容器`Dom`元素
 *  3.  `eventType`: 事件类型，主要是用于映射，例如`click` 映射 `onClick`、`onClickCapture`
 * @param container
 * @param eventType
 * @returns `collectPaths`返回的是一个对象，包含`capture`和`bubble`两个数组，分别存储捕获阶段和冒泡阶段的事件回调函数。
 */
function collectPaths(
  targetElement: DOMElement,
  container: Container,
  eventType: string
) {
  const paths: Paths = {
    capture: [],
    bubble: [],
  };
  while (targetElement && targetElement !== container) {
    const elementProps = targetElement[elementPropsKey];
    if (elementProps) {
      const callbackNames = getEventCallbackNameFromEventType(eventType);
      if (callbackNames) {
        callbackNames.forEach((callbackName, i) => {
          const callback = elementProps[callbackName];
          if (callback) {
            if (i === 0) {
              // capture 捕获阶段, 从上到下依次执行，所以最上面的元素应该是最先执行的。使用`unShift`保证后遍历到的，先执行。
              paths.capture.unshift(callback);
            } else {
              paths.bubble.push(callback);
            }
          }
        });
      }
    }
    targetElement = targetElement.parentNode as DOMElement;
  }
  return paths;
}

function getEventCallbackNameFromEventType(
  eventType: string
): string[] | undefined {
  return {
    click: ["onClickCapture", "onClick"],
  }[eventType];
}

function createSyntheticEvent(e: Event) {
  const syntheticEvent = e as SyntheticEvent;
  syntheticEvent.__stopPropagation = false;
  const originStopPropagation = e.stopPropagation;

  syntheticEvent.stopPropagation = () => {
    syntheticEvent.__stopPropagation = true;
    if (originStopPropagation) {
      originStopPropagation();
    }
  };
  return syntheticEvent;
}

function triggerEventFlow(
  paths: EventCallback[],
  syntheticEvent: SyntheticEvent
) {
  for (let i = 0; i < paths.length; i++) {
    const callback = paths[i];
    callback.call(null, syntheticEvent);

    if (syntheticEvent.__stopPropagation) {
      break;
    }
  }
}
