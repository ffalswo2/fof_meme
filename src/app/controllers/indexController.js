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