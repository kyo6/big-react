import React from "react";
import ReactDOM from "react-dom/client";

const App = () => {
  return <div>Hello World</div>;
};

const jsx = (
  <div>
    <span>React!</span>
  </div>
);

console.log(jsx);
console.log(<App />);
console.log(React);

ReactDOM.createRoot(document.getElementById("root")!).render(jsx);
