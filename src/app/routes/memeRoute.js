module.exports = function(app){
    const meme = require('../controllers/memeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/meme',jwtMiddleware, meme.getMeme);
    app.get('/meme/:memeIdx/similar',jwtMiddleware, meme.getSimilarMeme);
};