module.exports = function(app){
    const index = require('../controllers/indexController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/app', jwtMiddleware, index.default);
    app.get('/category',index.getCategory);
    app.get('/report-tag',index.getReportTag);
    app.get('/tag',index.getTag);
};
