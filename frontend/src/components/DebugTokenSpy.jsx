import React, { useEffect } from 'react';

const DebugTokenSpy = () => {
    useEffect(() => {
        const originalRemoveItem = localStorage.removeItem;
        const originalSetItem = localStorage.setItem;
        const originalClear = localStorage.clear;

        localStorage.removeItem = function (key) {
            if (key === 'access_token') {
                console.warn("[DebugTokenSpy] ⚠️ ACCESS_TOKEN REMOVED!");
                console.trace(); // Shows who called it
            }
            originalRemoveItem.apply(this, arguments);
        };

        localStorage.setItem = function (key, value) {
            if (key === 'access_token') {
                console.log("[DebugTokenSpy] 📝 Access token updated");
            }
            originalSetItem.apply(this, arguments);
        };

        localStorage.clear = function () {
            console.warn("[DebugTokenSpy] ⚠️ LOCALSTORAGE CLEARED!");
            console.trace();
            originalClear.apply(this, arguments);
        };

        return () => {
            // Restore? Maybe not, consistent spying is good.
            localStorage.removeItem = originalRemoveItem;
            localStorage.setItem = originalSetItem;
            localStorage.clear = originalClear;
        };
    }, []);

    return null;
};

export default DebugTokenSpy;
