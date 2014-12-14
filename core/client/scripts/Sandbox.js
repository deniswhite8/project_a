var logger = null,
    config = null;

var Sandbox = function() {
    logger = window.logger;
    config = window.config;
};

Sandbox.prototype.getFunction = function(expression) {
    var dataObjectName = 'params';
    
    var preparedExpression = expression
        .replace(/\[|]|{|}|`|var|function|new|throw|delete|debugger|window|this|if|while|for|case/g, '')
        .replace(/[a-zA-Z_$][0-9a-zA-Z_$]*/g, function(varName) {
            return dataObjectName + '.' + varName; 
        });
    
    config.sandbox.bind.each(function(name, value) {
        preparedExpression = preparedExpression.replace(
            new RegExp(dataObjectName + '.' + name, 'g'), value
        );
    });
    
    preparedExpression = 'return (' + preparedExpression + ');';
    
    try {
        return new Function(dataObjectName, preparedExpression);
    } catch (e) {
        logger.error('Incorrect avatar node function: ' + expression);
        return null;
    }
};

module.exports = Sandbox;