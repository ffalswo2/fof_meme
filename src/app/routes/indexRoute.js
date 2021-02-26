module.exports = function(app){
    const index = require('../controllers/indexController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/app', jwtMiddleware, index.default);
    app.get('/category',index.getCategory);
};
