export const fake = () => {
    const calls = [];
    const fn = function (...args) {
        calls.push(args);
    };

    Object.defineProperty(fn, 'calledOnce', {
        get() {
            return calls.length === 1;
        }
    });

    Object.defineProperty(fn, 'calls', {
        get() {
            return calls;
        }
    });

    Object.defineProperty(fn, 'callCount', {
        get() {
            return calls.length;
        }
    });

    Object.defineProperty(fn, 'lastCall', {
        get() {
            return calls[calls.length - 1];
        }
    });

    return fn;
};
