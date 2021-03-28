const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const { smtpTransport } = require('../../../config/email');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const usermDao = require('../dao/userDao');
const { constants } = require('buffer');
const regexPassword = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$@$!%*#?&])[A-Za-z\d$@$!%*#?&]{8,}$/;

/**
 update : 2020.10.4
 01.signUp API = 회원가입
 */
exports.signUp = async function (req, res) {
    const {
        email, password, nickname
    } = req.body;

    if (typeof email != "string" || typeof password != "string" || typeof nickname != "string") return res.json({isSuccess: false, code: 310, message: "타입을 다시 한번 확인해주세요"});
    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password || !regexPassword.test(password)) return res.json({isSuccess: false, code: 304, message: "비밀번호를 다시 확인해주세요."});
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

        // 이메일 중복 확인
        const emailRows = await usermDao.userEmailCheck(email);
        if (emailRows.length > 0) {

            return res.json({
                isSuccess: false,
                code: 308,
                message: "중복된 이메일입니다."
            });
        }
        logger.debug('Sign Up 요청 성공입니다.');

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

    if (typeof email != "string" || typeof password != "string") return res.json({isSuccess: false, code: 309, message: "타입을 다시 한번 확인해주세요"});
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

        if (userInfoRows.length < 1) {
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
        return res.status(500).send(`Error: ${err.message}`);
    }
};

exports.pickCategory = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        categoryIdx
    } = req.body;

    if (typeof categoryIdx != "object") return res.json({isSuccess: false, code: 302, message: "타입을 다시 한번 확인해주세요"});
    if (!categoryIdx) return res.json({isSuccess: false, code: 300, message: "카테고리 아이디값을 확인해주세요"});
    if (categoryIdx.length < 1) return res.json({isSuccess: false, code: 301, message: "카테고리 아이디값을 하나 이상은 보내주셔야 합니다"})

    try {
        const checkUserCategory = await usermDao.checkUserCategory(userId);

        if (checkUserCategory) {
            const transUserCategory = await usermDao.transUserCategory(userId,categoryIdx);
        } else {
            const userCategory = await usermDao.setUserCategory(userId,categoryIdx);
        }

        logger.debug('유저카테고리 등록 요청 성공');
        res.json({
            isSuccess: true,
            code: 200,
            message: "밈 집중선택 성공"
        });
    } catch (err) {
        logger.error(`App - UserCategory Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}


exports.getProfile = async function (req, res) {
    const userId = req.verifiedToken.userId;

    try {

        const userProfileRows = await usermDao.getUserProfile(userId);

        const profileInfo = userProfileRows[0][0];
        const insight = userProfileRows[1];


        if (!userProfileRows) {
            return res.json({
                isSuccess: false,
                code: 300,
                message: "프로필 조회 실패"
            });
        }

        let result = {};
        result['profile'] = profileInfo;
        result['insight'] = insight;

        res.json({
            data : result,
            isSuccess: true,
            code: 200,
            message: "프로필 조회 성공"
        });
    } catch (err) {
        logger.error(`App - UserProfile Query error\n: ${JSON.stringify(err)}`);
        return false;
    }
}

exports.signout = async function (req, res) {
    const userId = req.verifiedToken.userId;

    try {
        const userSignOut = await usermDao.deleteUser(userId);

        logger.debug('유저 탈퇴 등록 요청 성공');
        res.json({
            isSuccess: true,
            code: 200,
            message: "성공적으로 탈퇴되었습니다"
        });
    } catch (err) {
        logger.error(`App - UserCategory Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getUserMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    let {
        filter, page, size
    } = req.query;

    if (!filter) return res.json({ isSuccess: false, code: 313, message: "필터를 입력해주세요" });
    if (!page) return res.json({ isSuccess: false, code: 300, message: "페이지를 입력해주세요" });
    if (!size) return res.json({ isSuccess: false, code: 301, message: "사이즈를 입력해주세요" });
    if (page < 1) return res.json({ isSuccess: false, code: 302, message: "페이지 번호를 다시 확인해주세요" });

    page = (page - 1) * size

    if (filter === 'uploaded') { // 업로드한 밈 사진들 조회

        try {
            const userUploadedRows = await usermDao.selectUploadedMeme(userId,page,size);


            if (!userUploadedRows) {
                return res.json({
                    isSuccess: false,
                    code: 310,
                    message: "업로드한 밈들 조회 실패"
                });
            }

            res.json({
                data: userUploadedRows,
                isSuccess: true,
                code: 201,
                message: "업로드한 밈들 조회 성공"
            });
            logger.debug('업로드한 들 조회 요청 성공');

        } catch (err) {
            logger.error(`App - UploadedMeme Query error\n: ${JSON.stringify(err)}`);
            return res.status(500).send(`Error: ${err.message}`);
        }

    } else if (filter === 'favorite') { // 좋아요한 밈들 조회

        try {
            const userFavMemeRows = await usermDao.selectUserFavMeme(userId,page,size);

            if (!userFavMemeRows) {
                return res.json({
                    isSuccess: false,
                    code: 303,
                    message: "좋아요한 밈들 조회 실패"
                });
            }

            res.json({
                data: userFavMemeRows,
                isSuccess: true,
                code: 200,
                message: "좋아요한 밈 조회 성공"
            });
            logger.debug('좋아요한 밈들 조회 요청 성공');

        } catch (err) {
            logger.error(`App - FavoriteMeme Query error\n: ${JSON.stringify(err)}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
    } else { // 다른 필터값이 들어왔을 경우

        return res.json({
            isSuccess: false,
            code: 320,
            message: "존재하지 않는 필터입니다"
        });
    }


}


exports.changeProfile = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        email, nickname
    } = req.body;

    if (!email && !nickname) return res.json({isSuccess: false, code: 320, message: "이메일 혹은 비밀번호 중 한가지는 입력해주세요"});
    if (email && typeof email != "string") return res.json({isSuccess: false, code: 310, message: "이메일 타입을 다시 한번 확인해주세요"});
    if (nickname && typeof nickname != "string") return res.json({isSuccess: false, code: 311, message: "닉네임 타입을 다시 한번 확인해주세요"});

    if (email && email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (email && !regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (nickname && nickname.length > 20) return res.json({
        isSuccess: false,
        code: 307,
        message: "닉네임은 최대 20자리를 입력해주세요."
    });

    try {
        if (email && nickname) { // email nickname 둘다 변경
            const changeEmailNickname = await usermDao.updateUserEmailNickname(userId,email,nickname);

        }  else if (email && !nickname) { // email만 바꿈
            const changeEmail = await usermDao.updateUserEmail(userId,email);

        } else if (nickname && !email) { // nickname만 바꿈
            const changeNickname = await usermDao.updateUserNickname(userId,nickname);

        }

        logger.debug('프로필 변경 요청 성공');
        res.json({
            isSuccess: true,
            code: 200,
            message: "프로필 개인정보 변경 성공"
        });
    } catch (err) {
        logger.error(`App - changeProfile Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.sendEmail = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const userEmail = req.verifiedToken.email;

    var generateRandom = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const number = generateRandom(111111,999999)

    const mailOptions = {
        from: "makeus.fofapp@gmail.com",
        to: userEmail,
        subject: "[포프]인증 관련 메일입니다",
        text: "옆에 6자리의 숫자를 입력해주세요 : " + number
    };

    await smtpTransport.sendMail(mailOptions, (error, responses) =>{
        if(error){
            res.json({
                isSuccess: false,
                code: 300,
                message: "인증번호 이메일 발송 실패"
            });
        }else{
            res.json({
                number: number,
                isSuccess: true,
                code: 200,
                message: "인증번호 이메일 발송 성공"
            });
        }
        smtpTransport.close();
    });
}

exports.changeProfileImage = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const {
        imageUrl
    } = req.body;

    if (!imageUrl) return res.json({isSuccess: false, code: 300, message: "이미지URL을 입력해주세요"});
    if (typeof imageUrl != "string") return res.json({isSuccess: false, code: 301, message: "이미지 타입을 다시 한번 확인해주세요"});

    try {
        const changeProfileImage = await usermDao.updateUserImage(userId,imageUrl);

        logger.debug('프로필 이미지 변경 요청 성공');
        res.json({
            isSuccess: true,
            code: 200,
            message: "프로필 이미지 변경 성공"
        });
    } catch (err) {
        logger.error(`App - changeProfileImage Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.changePw = async function (req, res) {
    const userId = req.verifiedToken.userId;
    const userEmail = req.verifiedToken.email;

    const {
        password
    } = req.body;


    if (!password || !regexPassword.test(password)) return res.json({isSuccess: false, code: 304, message: "비밀번호를 다시 확인해주세요."});
    if (password.length < 6 || password.length > 20) return res.json({
        isSuccess: false,
        code: 305,
        message: "비밀번호는 6~20자리를 입력해주세요."
    });

    try {

        const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
        const updateUserPwParams = [hashedPassword,userId];

        const updateUserPwRows = await usermDao.changeUserPw(updateUserPwParams);


        logger.debug('비밀번호 변경 요청 성공입니다.');
        return res.json({
            isSuccess: true,
            code: 200,
            message: "비밀번호 변경 성공"
        });
    } catch (err) {
        logger.error(`App - SignUp Query error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};

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