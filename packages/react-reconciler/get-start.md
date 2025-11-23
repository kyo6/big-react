## React-reconciler 包

reconciler 的入口文件是`src/fiberReconciler`

### createContainer() 函数

从上面我们可以知道，入口`createRoot`首先调用的`createContainer`和`updateContainer`，我们把它写到`filerReconciler.ts`中, `createContainer`接受传入的 dom 元素。
