module.exports = function(app){
    const meme = require('../controllers/memeController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.get('/meme',jwtMiddleware, meme.getMeme);
    app.get('/meme/:memeIdx/similar',jwtMiddleware, meme.getSimilarMeme);
    app.post('/meme/:memeIdx/good',jwtMiddleware, meme.likeMeme);
    app.delete('/meme/:memeIdx',jwtMiddleware,meme.deleteMeme);
    app.get('/meme/:memeIdx',jwtMiddleware, meme.getMemeDetail);
    app.post('/meme/:memeIdx/report/:reportTagIdx',jwtMiddleware, meme.reportMeme);
};