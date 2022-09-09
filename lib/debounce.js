export const debounce = (fn, time) => {
  let timeoutHandle;

  return (...args) => {
    clearTimeout(timeoutHandle);

    timeoutHandle = setTimeout(() => {
      fn(...args);
    }, time);
  };
};
