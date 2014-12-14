var isBrowser = function() {
    try {
        window;
        return true;
    } catch (e) {
        return false;
    }
};

module.exports = isBrowser();