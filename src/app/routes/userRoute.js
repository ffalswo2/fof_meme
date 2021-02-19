module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.route('/signup').post(user.signUp);
    app.route('/login').post(user.signIn);

    app.get('/check', jwtMiddleware, user.check);
};