module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.post('/login',user.signIn);
    app.post('/user/meme',jwtMiddleware, user.pickCategory);
    app.get('/user/profile', jwtMiddleware, user.getProfile);
    app.get('/check', jwtMiddleware, user.check);
    app.delete('/user',jwtMiddleware, user.signout);
};