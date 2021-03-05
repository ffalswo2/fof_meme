module.exports = function(app){
    const search = require('../controllers/searchController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/search/meme',jwtMiddleware, search.getSearchMeme);
    app.get('/meme/trend/category/:categoryIdx',jwtMiddleware, search.getTrendCategoryMeme);
    app.get('/search/tag',jwtMiddleware, search.getTagByName);
    app.get('/tag/trend',jwtMiddleware, search.getTrendTag);
    app.get('/meme/tag/:tagIdx',jwtMiddleware, search.getMemeByTagIdx);

};