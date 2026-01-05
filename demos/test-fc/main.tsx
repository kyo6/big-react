import React, { useState } from "react";
import ReactDOM from "react-dom/client";

const App = () => {
  // @ts-ignore
  const [count, setCount] = useState(1210);
  return <div onClick={() => setCount(count + 1)} >{count}</div>

};

const jsx = (
  <div>
    <span>React!</span>
  </div>
);

// console.log(jsx);
// console.log(<App />);


ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
