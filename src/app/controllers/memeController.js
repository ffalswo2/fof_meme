const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const memeDao = require('../dao/memeDao');
const { constants } = require('buffer');

/**
 update : 2020.2.26 (금)
 01. HOME 화면 ( 집중선택 여부에 따라 분기처리 )
 */
exports.getMeme = async function (req, res) {
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

    if (filter === 'all') { // 전체 조회

        try {
            const userCategoryRows = await memeDao.checkUserCategory(userId);

            if (!userCategoryRows) { // 집중선택 건너띄었을 경우
                allMemeRows = await memeDao.selectAllMeme(userId,page,size);
            } else { // 집중선택 했을 시
                allMemeRows = await memeDao.selectUserMeme(userId,page,size);
            }

            if (!allMemeRows) {
                return res.json({
                    isSuccess: false,
                    code: 310,
                    message: "전체 밈 조회 실패"
                });
            }

            res.json({
                data: allMemeRows,
                isSuccess: true,
                code: 201,
                message: "전체 밈 조회 성공"
            });
            logger.debug('전체 밈 조회 요청 성공');

        } catch (err) {
            logger.error(`App - RecommendMeme Query error\n: ${JSON.stringify(err)}`);
            return res.status(500).send(`Error: ${err.message}`);
        }

    } else if (filter === 'recommend') { // 추천 조회

        try {
            const userCategoryRows = await memeDao.checkUserCategory(userId);

            if (!userCategoryRows) { // 집중선택 건너띄었을 경우
                memeRows = await memeDao.selectRecAllMeme(userId,page,size);
            } else { // 집중선택 했을 시
                memeRows = await memeDao.selectRecUserMeme(userId,page,size);
            }

            if (!memeRows) {
                return res.json({
                    isSuccess: false,
                    code: 303,
                    message: "추천 밈 조회 실패"
                });
            }

            res.json({
                data: memeRows,
                isSuccess: true,
                code: 200,
                message: "추천 밈 조회 성공"
            });
            logger.debug('추천 밈 조회 요청 성공');

        } catch (err) {
            logger.error(`App - RecommendMeme Query error\n: ${JSON.stringify(err)}`);
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

exports.getSimilarMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx
    } = req.params

    let {
        page, size
    } = req.query;

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });
    if (!page) return res.json({ isSuccess: false, code: 300, message: "페이지를 입력해주세요" });
    if (!size) return res.json({ isSuccess: false, code: 301, message: "사이즈를 입력해주세요" });
    if (page < 1) return res.json({ isSuccess: false, code: 302, message: "페이지 번호를 다시 확인해주세요" });

    page = (page - 1) * size

    try {
        const similarMemeRows = await memeDao.selectSimilarMeme(memeIdx);

        if (!similarMemeRows) {
            return res.json({
                isSuccess: false,
                code: 303,
                message: "유사 밈 조회 실패"
            });
        }

        res.json({
            data: similarMemeRows,
            isSuccess: true,
            code: 200,
            message: "유사한 밈 조회 성공"
        });
        logger.debug('유사 밈 조회 요청 성공');

    } catch (err) {
        logger.error(`App - SimilarMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.likeMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx
    } = req.params

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });

    try {
        const checkMemeExist = await memeDao.checkMemeExist(memeIdx)
        if (checkMemeExist) { // 사진이 존재한다면
            const checkLikeMeme = await memeDao.checkUserLikeMeme(userId,memeIdx)

            if (checkLikeMeme) { // 이미 좋아요가 되있다면
                const hateMeme = await  memeDao.dislikeMeme(userId,memeIdx);

                res.json({
                    isSuccess: true,
                    code: 201,
                    message: "밈 사진 좋아요 취소 성공"
                });

            } else { // 좋아요가 되있지 않다면
                const favMeme = await memeDao.likeMeme(userId,memeIdx);

                res.json({
                    isSuccess: true,
                    code: 200,
                    message: "밈 사진 좋아요 성공"
                });
            }
        } else { // 사진이 없다면
            res.json({
                isSuccess: false,
                code: 301,
                message: "이미 삭제됬거나 존재하지 않는 사진입니다"
            });
        }

        logger.debug('밈 좋아요 요청 성공');

    } catch (err) {
        logger.error(`App - likeMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.deleteMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx
    } = req.params

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });

    try {

        const checkMemeExist = await memeDao.checkMemeExist(memeIdx)

        if (checkMemeExist) { // 밈이 존재한다면
            const checkMemeUploader = await memeDao.checkUploader(memeIdx) // 밈을 올린 유저 idx을 가져와서 비교
            if (userId === checkMemeUploader[0].userIdx) { // 밈을 올린 사람이라면
                const deleteMeme = await  memeDao.deleteMeme(userId,memeIdx);

                res.json({
                    isSuccess: true,
                    code: 200,
                    message: "밈 사진 삭제 성공"
                });

            } else { // 밈을 올린 주인이 아니라면

                res.json({
                    isSuccess: false,
                    code: 300,
                    message: "해당 사진을 삭제할 권한이 없습니다"
                });
            }
        } else { // 밈이 존재하지 않는다면
            res.json({
                isSuccess: false,
                code: 301,
                message: "이미 삭제됬거나 존재하지 않는 사진입니다"
            });
        }

        logger.debug('밈 삭제 요청 성공');

    } catch (err) {
        logger.error(`App - deleteMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getMemeDetail = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx
    } = req.params

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });

    try {
        const checkMemeExist = await memeDao.checkMemeExist(memeIdx)

        if (checkMemeExist) { // 밈이 존재한다면
            const memeDetail = await memeDao.selectMemeDetail(userId,memeIdx) // 밈 상세보기

            let result = {};
            result['memeDetail'] = memeDetail[0][0];
            result['similar'] = memeDetail[1];

            res.json({
                data: result,
                isSuccess: true,
                code: 200,
                message: "밈 상세정보 조회 성공"
            });

        } else { // 밈이 존재하지 않는다면
            res.json({
                isSuccess: false,
                code: 301,
                message: "이미 삭제됬거나 존재하지 않는 사진입니다"
            });
        }

        logger.debug('밈 상세보기 요청 성공');

    } catch (err) {
        logger.error(`App - MemeDetail Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}


exports.reportMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx,reportTagIdx
    } = req.params

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });
    if (!reportTagIdx) return res.json({ isSuccess: false, code: 304, message: "태그 아이디값을 입력해주세요" });

    try {

        const checkMemeExist = await memeDao.checkMemeExist(memeIdx)
        const checkReportTagExist = await memeDao.checkReportTagExist(reportTagIdx)
        const checkReported = await memeDao.checkUserReport(userId,memeIdx)

        if (checkMemeExist) { // 밈이 존재한다면
            if (!checkReportTagExist) { // 태그가 없는 태그라면
                res.json({
                    isSuccess: false,
                    code: 300,
                    message: "존재하지 않는 태그 아이디값입니다"
                });
            }

            if (checkReported) { // 이미 신고한 사진이라면
                res.json({
                    isSuccess: false,
                    code: 307,
                    message: "이미 신고한 사진입니다"
                });
            }

            const reportMeme = await memeDao.reportMeme(userId,memeIdx,reportTagIdx) // 신고하기

            res.json({
                isSuccess: true,
                code: 200,
                message: "신고하기 성공"
            });


        } else { // 밈이 존재하지 않는다면
            res.json({
                isSuccess: false,
                code: 301,
                message: "이미 삭제됬거나 존재하지 않는 사진입니다"
            });
        }

        logger.debug('밈 신고하기 요청 성공');

    } catch (err) {
        logger.error(`App - ReportMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.postMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        title,copyright,imageUrl,tag,categoryIdx
    } = req.body

    if (!title) return res.json({ isSuccess: false, code: 300, message: "제목을 입력해주세요" });
    if (!copyright) return res.json({ isSuccess: false, code: 304, message: "저작권표시를 입력해주세요" });
    if (!tag) return res.json({ isSuccess: false, code: 302, message: "태그값들을 입력해주세요" });
    if (!imageUrl) return res.json({ isSuccess: false, code: 301, message: "이미지 주소를 입력해주세요" });
    if (!categoryIdx) return res.json({ isSuccess: false, code: 303, message: "카테고리 아이디값을 입력해주세요" });

    if (typeof tag != "object") return res.json({isSuccess: false, code: 305, message: "태그 타입을 다시 한번 확인해주세요"});

    try {

        const postMemeRows = await memeDao.insertNewMeme(userId,title,imageUrl,copyright,tag,categoryIdx);

        if (!postMemeRows) {
            res.json({
                isSuccess: false,
                code: 390,
                message: "게시물을 올리는데 실패했습니다"
            });
        }

        logger.debug('밈 올리기 요청 성공');
        res.json({
            isSuccess: true,
            code: 200,
            message: "게시물을 올리는데 성공했습니다"
        });


    } catch (err) {
        logger.error(`App - postMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.updateCopyright = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    const {
        memeIdx
    } = req.params

    const {
        copyright
    } = req.body

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이디값을 입력해주세요" });
    if (!copyright) return res.json({ isSuccess: false, code: 302, message: "수정할 저작권값을 입력해주세요"});
    if (typeof copyright !== "string") return res.json({ isSuccess: false, code: 304, message: "저작권값 타입을 확인해해주세요"});

    try {

        const checkMemeExist = await memeDao.checkMemeExist(memeIdx)

        if (checkMemeExist) { // 밈이 존재한다면

            const updateCopyright = await memeDao.updateCopyright(memeIdx,copyright);

            res.json({
                isSuccess: true,
                code: 200,
                message: "저작권표시 수정 성공"
            });


        } else { // 밈이 존재하지 않는다면
            res.json({
                isSuccess: false,
                code: 301,
                message: "이미 삭제됬거나 존재하지 않는 사진입니다"
            });
        }

        logger.debug('밈 저작권 수정 요청 성공');

    } catch (err) {
        logger.error(`App - updateCopyright Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}