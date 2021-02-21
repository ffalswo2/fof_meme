const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const usermDao = require('../dao/userDao');
const { constants } = require('buffer');

/**
 update : 2020.10.4
 01.signUp API = 회원가입
 */
exports.signUp = async function (req, res) {
    const {
        email, password, nickname
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요."});
    if (password.length < 6 || password.length > 20) return res.json({
        isSuccess: false,
        code: 305,
        message: "비밀번호는 6~20자리를 입력해주세요."
    });

    if (!nickname) return res.json({isSuccess: false, code: 306, message: "닉네임을 입력 해주세요."});
    if (nickname.length > 20) return res.json({
        isSuccess: false,
        code: 307,
        message: "닉네임은 최대 20자리를 입력해주세요."
    });
    try {
        logger.debug('Sign Up 요청 성공입니다.');
        // 이메일 중복 확인
        const emailRows = await usermDao.userEmailCheck(email);
        if (emailRows.length > 0) {

            return res.json({
                isSuccess: false,
                code: 308,
                message: "중복된 이메일입니다."
            });
        }

        // 닉네임 중복 확인
        const nicknameRows = await usermDao.userNicknameCheck(nickname);
        if (nicknameRows.length > 0) {
            return res.json({
                isSuccess: false,
                code: 309,
                message: "중복된 닉네임입니다."
            });
        }

        // TRANSACTION : advanced
        // await connection.beginTransaction(); // START TRANSACTION
        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        const insertUserInfoParams = [email, hashedPassword, nickname];

        const insertUserRows = await usermDao.insertUserInfo(insertUserInfoParams);

        //  await connection.commit(); // COMMIT
        // connection.release();

        return res.json({
            isSuccess: true,
            code: 200,
            message: "회원가입 성공"
        });
    } catch (err) {
        // await connection.rollback(); // ROLLBACK
        // connection.release();
        logger.error(`App - SignUp Query error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};

/**
 update : 2020.10.4
 02.signIn API = 로그인
 **/
exports.signIn = async function (req, res) {
    const {
        email, password
    } = req.body;


    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요"});
    try {
        logger.debug('Sign In 요청 성공입니다.');
        const userInfoRows = await usermDao.selectUserInfo(email);

        // console.log(userInfoRows.length)
        if (userInfoRows[0].length < 1) {
            return res.json({
                isSuccess: false,
                code: 310,
                message: "아이디를 확인해주세요"
            });
        }

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        // console.log(hashedPassword)
        // console.log(userInfoRows)
        // console.log(userInfoRows[0].password)
        if (userInfoRows[0].password !== hashedPassword) {
            return res.json({
                isSuccess: false,
                code: 311,
                message: "비밀번호를 확인해주세요."
            });
        }

        if (userInfoRows[0].status === "INACTIVE") {
            return res.json({
                isSuccess: false,
                code: 312,
                message: "비활성화 된 계정입니다."
            });
        } else if (userInfoRows[0].status === "DELETED") {
            return res.json({
                isSuccess: false,
                code: 313,
                message: "탈퇴 된 계정입니다."
            });
        }
        //토큰 생성
        let token = await jwt.sign({
                userId: userInfoRows[0].idx,
                email: userInfoRows[0].email
            }, // 토큰의 내용(payload)
            secret_config.jwtsecret, // 비밀 키
            {
                expiresIn: '365d',
                subject: 'userInfo',
            } // 유효 시간은 365일
        );


        res.json({
            userInfo: userInfoRows[0],
            jwt: token,
            isSuccess: true,
            code: 200,
            message: "로그인 성공"
        });

    } catch (err) {
        logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
        return false;
    }
};

exports.getProfile = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const userEmail = req.verifiedToken.email;
    // const userEmail = req.verifiedToken.email;

    res.json({

        isSuccess: true,
        code: 200,
        message: "테스트 성공"
    });
    // try {
    //     const userProfileRows = await userDao.getUserProfile(userId);
    //
    //     if (!userProfileRows) {
    //         return res.json({
    //             isSuccess: false,
    //             code: 300,
    //             message: "프로필 조회 실패"
    //         });
    //     };
    //
    //     res.json({
    //         result: userProfileRows,
    //         isSuccess: true,
    //         code: 200,
    //         message: "프로필 조회 성공"
    //     });
    // } catch (err) {
    //     logger.error(`App - UserProfile Query error\n: ${JSON.stringify(err)}`);
    //     return false;
    // }
}

/**
 update : 2019.09.23
 03.check API = token 검증
 **/
exports.check = async function (req, res) {
    res.json({
        isSuccess: true,
        code: 200,
        message: "검증 성공",
        info: req.verifiedToken
    })
};