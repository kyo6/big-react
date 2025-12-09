import React, { useState } from "react";
import ReactDOM from "react-dom/client";

const App = () => {
  const [count, setCount] = useState(1);
  return (
    <div>
      <p>{count}</p>
    </div>
  );
};

const jsx = (
  <div>
    <span>React!</span>
  </div>
);

console.log(jsx);
console.log(<App />);
console.log(React);

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
