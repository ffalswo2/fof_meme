const { pool } = require("../../../config/database");


async function selectUserMeme(userId,page,size) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectMemeQuery = `
        select Meme.idx                                            as memeIdx,
               User.idx                                            as userIdx,
               User.profileImage                                   as profileImage,
               User.nickName                                       as nickname,
               imageUrl,
               concat(group_concat(distinct concat('#', categoryTitle)), ',',
                      group_concat(distinct concat('#', tagName))) as Tag
        from Meme
                 join MemeCategory on MemeCategory.memeIdx = Meme.idx
                 join Category on Category.idx = MemeCategory.categoryIdx
                 join User on User.idx = Meme.userIdx
                 join MemeTag on MemeTag.memeIdx = Meme.idx
                 join Tag on MemeTag.tagIdx = Tag.idx
        where Category.idx in (select categoryIdx from UserCategory where UserCategory.userIdx = ?)
        group by Meme.idx limit `+page+`, `+size+`;
                `;
    const selectMemeParams = [userId,page,size];
    const [memeRows] = await connection.query(
        selectMemeQuery,
        selectMemeParams
    );
    connection.release();

    return memeRows;
}

async function selectAllMeme(userId,page,size) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectMemeQuery = `
        select Meme.idx                                            as memeIdx,
               User.idx                                            as userIdx,
               User.profileImage                                   as profileImage,
               User.nickName                                       as nickname,
               imageUrl,
               concat(group_concat(distinct concat('#', categoryTitle)), ',',
                      group_concat(distinct concat('#', tagName))) as Tag
        from Meme
                 join User on User.idx = Meme.userIdx
                 join MemeCategory on MemeCategory.memeIdx = Meme.idx
                 join Category on Category.idx = MemeCategory.categoryIdx
                 join MemeTag on MemeTag.memeIdx = Meme.idx
                 join Tag on MemeTag.tagIdx = Tag.idx
        group by Meme.idx limit `+page+`, `+size+`;
                `;
    const selectMemeParams = [userId,page,size];
    const [memeRows] = await connection.query(
        selectMemeQuery,
        selectMemeParams
    );
    connection.release();

    return memeRows;
}

async function checkUserCategory(userId) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkUserCategoryQuery = `
        select exists (select categoryIdx from UserCategory where userIdx = ?) as exist;
        `;
        const checkUserCategoryParams = [userId];
        const [checkUserCategoryRows] = await connection.query(
            checkUserCategoryQuery,
            checkUserCategoryParams
        );
        connection.release();

        return checkUserCategoryRows[0].exist;
    } catch (err) {
        logger.error(`App - checkUserCategory DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function selectSimilarMeme(memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const similarMemeQuery = `
            select Meme.idx as memeIdx, imageUrl
            from Meme
                     left join MemeCategory on Meme.idx = MemeCategory.memeIdx
                     left join Category on Category.idx = MemeCategory.categoryIdx
            where Category.idx in (select Category.idx as categoryIdx
                                   from Meme
                                            left join MemeCategory on Meme.idx = MemeCategory.memeIdx
                                            left join Category on Category.idx = MemeCategory.categoryIdx
                                   where Meme.idx = ?) and Meme.idx not in (select idx from Meme where Meme.idx = ?)
            group by Meme.idx;
        `;
        const similarMemeParams = [memeIdx,memeIdx];
        const [similarMemeRows] = await connection.query(
            similarMemeQuery,
            similarMemeParams
        );
        connection.release();

        return similarMemeRows;
    } catch (err) {
        logger.error(`App - selectSimilarMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkUserLikeMeme(userId,memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkUserLikeMemeQuery = `
            select exists(select userIdx, memeIdx from \`Like\` where userIdx = ? and memeIdx = ?) as exist;
        `;
        const checkUserLikeMemeParams = [userId,memeIdx];
        const [checkUserLikeMemeRows] = await connection.query(
            checkUserLikeMemeQuery,
            checkUserLikeMemeParams
        );
        connection.release();

        return checkUserLikeMemeRows[0].exist;
    } catch (err) {
        logger.error(`App - checkUserLikeMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function dislikeMeme(userId,memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const dislikeMemeQuery = `
            delete
            from \`Like\`
            where userIdx = ?
              and memeIdx = ?;
        `;
        const dislikeMemeParams = [userId,memeIdx];
        const [dislikeMemeRows] = await connection.query(
            dislikeMemeQuery,
            dislikeMemeParams
        );
        connection.release();

        return dislikeMemeRows;
    } catch (err) {
        logger.error(`App - dislikeMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function likeMeme(userId,memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const likeMemeQuery = `
            insert into \`Like\` (userIdx, memeIdx)
            values (?, ?);
        `;
        const likeMemeParams = [userId,memeIdx];
        const [likeMemeRows] = await connection.query(
            likeMemeQuery,
            likeMemeParams
        );
        connection.release();

        return likeMemeRows;
    } catch (err) {
        logger.error(`App - likeMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkUploader(memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkUploaderQuery = `
            select userIdx from Meme where Meme.idx = ?;
        `;
        const checkUploaderParams = [memeIdx];
        const [checkUploaderRows] = await connection.query(
            checkUploaderQuery,
            checkUploaderParams
        );
        connection.release();

        return checkUploaderRows;
    } catch (err) {
        logger.error(`App - checkUploader DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function deleteMeme(userId,memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const deleteMemeQuery = `
            delete from Meme where userIdx = ? and Meme.idx = ?;
        `;
        const deleteMemeParams = [userId,memeIdx];
        const [deleteMemeRows] = await connection.query(
            deleteMemeQuery,
            deleteMemeParams
        );
        connection.release();

        return deleteMemeRows;
    } catch (err) {
        logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkMemeExist(memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const checkMemeExistQuery = `
            select exists(select idx from Meme where idx = ?) as exist;
        `;
        const checkMemeExistParams = [memeIdx];
        const [checkMemeExistRows] = await connection.query(
            checkMemeExistQuery,
            checkMemeExistParams
        );
        connection.release();

        return checkMemeExistRows[0].exist;
    } catch (err) {
        logger.error(`App - checkMemeExist DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

module.exports = {
    selectUserMeme,
    selectAllMeme,
    checkUserCategory,
    selectSimilarMeme,
    checkUserLikeMeme,
    dislikeMeme,
    likeMeme,
    checkUploader,
    deleteMeme,
    checkMemeExist
};
