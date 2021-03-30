const { pool } = require("../../../config/database");

// search
async function defaultDao() {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectEmailQuery = `
                    SELECT id, email, nickname, createdAt, updatedAt 
                    FROM UserInfo `;

    const [rows] = await connection.query(selectEmailQuery)
    connection.release();

    return rows;
}

async function searchMemeByCategory(word,page,size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const searchQuery = `
            select Meme.idx as memeIdx, imageUrl
            from Meme
                     join MemeCategory on MemeCategory.memeIdx = Meme.idx
                     join Category on MemeCategory.categoryIdx = Category.idx
            where replace(categoryTitle, ' ', '') like concat('%', replace(?,' ',''), '%') limit ` + page + `, ` + size + `;
        `;
        const searchParams = [word,page,size];
        const [searchRows] = await connection.query(
            searchQuery,
            searchParams
        );
        connection.release();

        return searchRows;
    } catch (err) {
        connection.release();
        logger.error(`App - searchMemeByCategory DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function searchMemeByTag(word,page,size) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        await connection.beginTransaction();

        const searchQuery = `
            select Meme.idx as memeIdx, imageUrl,Tag.idx as tagIdx
            from Meme
                     join MemeTag on MemeTag.memeIdx = Meme.idx
                     join Tag on MemeTag.tagIdx = Tag.idx
            where replace(tagName, ' ', '') like concat('%', replace(?,' ',''), '%') group by memeIdx limit ` + page + `, ` + size + `;
        `;
        const searchParams = [word,page,size];
        const [searchRows] = await connection.query(
            searchQuery,
            searchParams
        );

        const tagId = searchRows[0].tagIdx;

        const updateCountQuery = `
            update Tag
set searchCnt = searchCnt + 1
where Tag.idx = ?;
        `;
        const updateCountParams = [tagId];
        const [updateCountRows] = await connection.query(
            updateCountQuery,
            updateCountParams
        );

        connection.commit();
        connection.release();

        return searchRows;
    } catch (err) {
        connection.rollback();
        connection.release();
        logger.error(`App - searchMemeByTag DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkCategoryExist(categoryIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkCategoryExistQuery = `
            select exists(select idx from Category where idx = ?) as exist;
        `;
        const checkCategoryExistParams = [categoryIdx];
        const [checkCategoryExistRows] = await connection.query(
            checkCategoryExistQuery,
            checkCategoryExistParams
        );
        connection.release();

        return checkCategoryExistRows[0].exist;
    } catch (err) {
        connection.release();
        logger.error(`App - checkCategoryExist DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkTagExist(tagIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkTagExistQuery = `
            select exists(select idx from Tag where idx = ?) as exist;
        `;
        const checkTagExistParams = [tagIdx];
        const [checkTagExistRows] = await connection.query(
            checkTagExistQuery,
            checkTagExistParams
        );
        connection.release();

        return checkTagExistRows[0].exist;
    } catch (err) {
        connection.release();
        logger.error(`App - checkCategoryExist DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function selectCategoryTopMeme(categoryIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        const timeQuery = `
        select concat(date_format(now(), '%Y.%m.%d %H:'), '00 업데이트') as updateTime;
        `;
        const [timeRows] = await connection.query(timeQuery)

        const categoryTopMemeQuery = `
            select memeIdx,imageUrl, view
from Meme
         left join MemeCategory on MemeCategory.memeIdx = Meme.idx
         left join Category on Category.idx = MemeCategory.categoryIdx
where MemeCategory.categoryIdx = ? and Meme.updatedAt >= timestamp(DATE_ADD(NOW(), INTERVAL -1 month))
  and Meme.updatedAt <= timestamp(now())
order by view desc
limit 5;
        `;
        const categoryTopMemeParams = [categoryIdx];
        const [categoryTopMemeRows] = await connection.query(
            categoryTopMemeQuery,
            categoryTopMemeParams
        );
        connection.release();

        return [categoryTopMemeRows,timeRows];
    } catch (err) {
        connection.release();
        logger.error(`App - selectCategoryTopMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function selectTrendTag() {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        const timeQuery = `
select concat(date_format(now(), '%Y-%m-%d %H:'), '00 업데이트') as updateTime;
        `;

        const [timeRows] = await connection.query(timeQuery)

        const trendTagQuery = `
            select Tag.idx as tagIdx, tagName, searchCnt
            from Tag
                     join MemeTag on MemeTag.tagIdx = Tag.idx
            where MemeTag.createdAt >= timestamp(DATE_ADD(NOW(), INTERVAL -1 month))
              and MemeTag.createdAt <= timestamp(now()) group by tagIdx
            order by searchCnt desc
                limit 5;
        `;

        const [trendTagRows] = await connection.query(
            trendTagQuery
        );
        connection.release();

        return [trendTagRows,timeRows];
    } catch (err) {
        connection.release();
        logger.error(`App - selectTrendTag DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function selectMemeByTagIdx(tagIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);

        const countTagMemeQuery = `
select count(Meme.idx) as memeCount
from Meme
         join MemeTag on MemeTag.memeIdx = Meme.idx
         join Tag on MemeTag.tagIdx = Tag.idx
where tagIdx = ?;
        `;

        const countTagMemeParams = [tagIdx];
        const [countTagMemeRows] = await connection.query(
            countTagMemeQuery,
            countTagMemeParams
        )

        const tagMemeQuery = `
            select Meme.idx as memeIdx, imageUrl
            from Meme
                     join MemeTag on MemeTag.memeIdx = Meme.idx
                     join Tag on MemeTag.tagIdx = Tag.idx
            where tagIdx = ?;
        `;

        const tagMemeParams = [tagIdx];
        const [tagMemeRows] = await connection.query(
            tagMemeQuery,
            tagMemeParams
        );
        connection.release();

        return [tagMemeRows,countTagMemeRows];
    } catch (err) {
        connection.release();
        logger.error(`App - selectTrendTag DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function searchTagByName(word) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const searchQuery = `
            select idx as tagIdx, tagName
from Tag
where replace(tagName, ' ', '') like concat('%', replace(?,' ',''), '%');
        `;
        const searchParams = [word];
        const [searchRows] = await connection.query(
            searchQuery,
            searchParams
        );
        connection.release();

        return searchRows;
    } catch (err) {
        connection.release();
        logger.error(`App - searchTagByName DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

module.exports = {
    searchMemeByCategory,
    searchMemeByTag,
    checkCategoryExist,
    selectCategoryTopMeme,
    selectTrendTag,
    selectMemeByTagIdx,
    checkTagExist,
    searchTagByName
};
