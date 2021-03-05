const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const indexDao = require('../dao/indexDao');

exports.default = async function (req, res) {
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            const [rows] = await indexDao.defaultDao();
            return res.json(rows);
        } catch (err) {
            logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
};

exports.getCategory = async function (req, res) {
    // const userId = req.verifiedToken.userId;

    try {
        const category = await indexDao.selectCategory();

        logger.debug('카테고리 가져오기 요청 성공');
        res.json({
            data: category,
            isSuccess: true,
            code: 200,
            message: "카테고리 조회 성공"
        });
    } catch (err) {
        logger.error(`App - GetCategory Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getReportTag = async function (req, res) {
    // const userId = req.verifiedToken.userId;

    try {
        const reportTag = await indexDao.selectReportTag();

        if (!reportTag) {
            res.json({
                isSuccess: false,
                code: 300,
                message: "신고태그 목록 조회 실패"
            });
        }

        logger.debug('신고 태그 요청 성공');
        res.json({
            data: reportTag,
            isSuccess: true,
            code: 200,
            message: "신고태그 목록 조회 성공"
        });
    } catch (err) {
        logger.error(`App - getReportTag Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getTag = async function (req, res) {
    // const userId = req.verifiedToken.userId;

    try {
        const reportTag = await indexDao.selectTag();

        if (!reportTag) {
            res.json({
                isSuccess: false,
                code: 300,
                message: "랜덤 태그 목록 조회 실패"
            });
        }

        logger.debug('태그 요청 성공');
        res.json({
            data: reportTag,
            isSuccess: true,
            code: 200,
            message: "랜덤 8개의 태그 목록 조회 성공"
        });
    } catch (err) {
        logger.error(`App - getTag Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}