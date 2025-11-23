import react from "./react.config";
import reactDom from "./react-dom.config";

export default () => {
  return [...react, ...reactDom];
};
