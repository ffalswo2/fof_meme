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
        page, size
    } = req.query;

    if (!page) return res.json({ isSuccess: false, code: 300, message: "페이지를 입력해주세요" });
    if (!size) return res.json({ isSuccess: false, code: 301, message: "사이즈를 입력해주세요" });
    if (page < 1) return res.json({ isSuccess: false, code: 302, message: "페이지 번호를 다시 확인해주세요" });

    page = (page - 1) * size

    try {
        const userCategoryRows = await memeDao.checkUserCategory(userId);

        if (!userCategoryRows) {
            memeRows = await memeDao.selectAllMeme(userId,page,size);
        } else {
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
        logger.error(`App - AllMeme Query error\n: ${JSON.stringify(err)}`);
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

    if (!memeIdx) return res.json({ isSuccess: false, code: 303, message: "밈 아이다값을 입력해주세요" });
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