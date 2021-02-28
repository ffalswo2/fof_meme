module.exports = function(app){
    const meme = require('../controllers/memeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/meme/recommend',jwtMiddleware, meme.getRecommendMeme);
    app.get('/meme/:memeIdx/similar',jwtMiddleware, meme.getSimilarMeme);
    app.post('/meme/:memeIdx/good',jwtMiddleware, meme.likeMeme);
    app.delete('/meme/:memeIdx',jwtMiddleware,meme.deleteMeme);
};