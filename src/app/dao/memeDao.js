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
        logger.error(`App - checkProduct DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function selectSimilarMeme(memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const similarMemeQuery = `
            select Meme.idx as memeIdx,imageUrl
            from Meme
                     left join MemeCategory on Meme.idx = MemeCategory.memeIdx
                     left join Category on Category.idx = MemeCategory.categoryIdx
            where Category.idx in (select Category.idx as categoryIdx
                                   from Meme
                                            left join MemeCategory on Meme.idx = MemeCategory.memeIdx
                                            left join Category on Category.idx = MemeCategory.categoryIdx
                                   where Meme.idx = ?) group by Meme.idx;
        `;
        const similarMemeParams = [memeIdx];
        const [similarMemeRows] = await connection.query(
            similarMemeQuery,
            similarMemeParams
        );
        connection.release();

        return similarMemeRows;
    } catch (err) {
        logger.error(`App - checkProduct DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}


module.exports = {
    selectUserMeme,
    selectAllMeme,
    checkUserCategory,
    selectSimilarMeme
};
