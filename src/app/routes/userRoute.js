module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.route('/login').post(user.signIn);
    app.get('/user/profile', jwtMiddleware, user.getProfile);
    app.get('/check', jwtMiddleware, user.check);
};