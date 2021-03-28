module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.post('/login',user.signIn);
    app.post('/user/meme',jwtMiddleware, user.pickCategory);
    app.get('/profile', jwtMiddleware, user.getProfile);
    app.get('/check', jwtMiddleware, user.check);
    app.delete('/user',jwtMiddleware, user.signout);
    app.get('/user/meme', jwtMiddleware, user.getUserMeme);
    app.patch('/profile', jwtMiddleware, user.changeProfile);
    app.get('/email/auth', jwtMiddleware, user.sendEmail);
    app.patch('/password', jwtMiddleware, user.changePw);
    app.patch('/profile/image', jwtMiddleware, user.changeProfileImage);
};