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
exports.getRecommendMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;
    // const userEmail = req.verifiedToken.email;

    let {
        page, size
    } = req.query;

    if (!page) return res.json({ isSuccess: false, code: 300, message: "페이지를 입력해주세요" });
    if (!size) return res.json({ isSuccess: false, code: 301, message: "사이즈를 입력해주세요" });
    if (page < 1) return res.json({ isSuccess: false, code: 302, message: "페이지 번호를 다시 확인해주세요" });

    page = (page - 1) * size

    try {
        const userCategoryRows = await memeDao.checkUserCategory(userId);

        if (!userCategoryRows) { // 집중선택 건너띄었을 경우
            memeRows = await memeDao.selectAllMeme(userId,page,size);
        } else { // 집중선택 했을 시
            memeRows = await memeDao.selectUserMeme(userId,page,size);
        }

        if (!memeRows) {
            return res.json({
                isSuccess: false,
                code: 303,
                message: "전체 밈 조회 실패"
            });
        }

        res.json({
            data: memeRows,
            isSuccess: true,
            code: 200,
            message: "전체 밈 조회 성공"
        });
        logger.debug('전체 밈 조회 요청 성공');

    } catch (err) {
        logger.error(`App - RecommendMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
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