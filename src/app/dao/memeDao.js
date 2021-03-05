const { pool } = require("../../../config/database");


async function selectRecUserMeme(userId,page,size) {
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
          and Meme.idx not in (select \`Like\`.memeIdx from \`Like\` where \`Like\`.userIdx = ?)
        group by Meme.idx limit `+page+`, `+size+`;
                `;
    const selectMemeParams = [userId,userId,page,size];
    const [memeRows] = await connection.query(
        selectMemeQuery,
        selectMemeParams
    );
    connection.release();

    return memeRows;
}

async function selectRecAllMeme(userId,page,size) {
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
        where Meme.idx not in (select \`Like\`.memeIdx from \`Like\` where \`Like\`.userIdx = ?)
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

async function selectAllMeme(userId,page,size) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectAllMemeQuery = `
        select Meme.idx                                            as memeIdx,
               imageUrl
        from Meme
                 join User on User.idx = Meme.userIdx
                 join MemeCategory on MemeCategory.memeIdx = Meme.idx
                 join Category on Category.idx = MemeCategory.categoryIdx
                 join MemeTag on MemeTag.memeIdx = Meme.idx
                 join Tag on MemeTag.tagIdx = Tag.idx
        group by Meme.idx limit `+page+`, `+size+`;
                `;
    const selectAllMemeParams = [userId,page,size];
    const [selectAllMemeRows] = await connection.query(
        selectAllMemeQuery,
        selectAllMemeParams
    );
    connection.release();

    return selectAllMemeRows;
}

async function selectUserMeme(userId,page,size) {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectUserMemeQuery = `
        select Meme.idx                                            as memeIdx,
               imageUrl
        from Meme
                 join MemeCategory on MemeCategory.memeIdx = Meme.idx
                 join Category on Category.idx = MemeCategory.categoryIdx
                 join User on User.idx = Meme.userIdx
                 join MemeTag on MemeTag.memeIdx = Meme.idx
                 join Tag on MemeTag.tagIdx = Tag.idx
        where Category.idx in (select categoryIdx from UserCategory where UserCategory.userIdx = ?)
        group by Meme.idx limit `+page+`, `+size+`;
                `;
    const selectUserMemeParams = [userId,page,size];
    const [selectUserMemeRows] = await connection.query(
        selectUserMemeQuery,
        selectUserMemeParams
    );
    connection.release();

    return selectUserMemeRows;
}

async function selectMemeDetail(userId,memeIdx) {
    const connection = await pool.getConnection(async (conn) => conn);
    try {
        await connection.beginTransaction();

        const memeDetailQuery = `
            select Meme.idx                                                                      as memeIdx,
                   Meme.title                                                                    as memeTitle,
                   Meme.copyright                                                                as copyright,
                   User.idx                                                                      as userIdx,
                   User.profileImage                                                             as profileImage,
                   User.nickName                                                                 as nickname,
                   imageUrl,
                   (select exists(select \`Like\`.userIdx, \`Like\`.memeIdx
                                  from \`Like\`
                                  where \`Like\`.userIdx = ? and \`Like\`.memeIdx = ?) as exist) as likeStatus,
                   concat(group_concat(distinct concat('#', categoryTitle)), ',',
                          group_concat(distinct concat('#', tagName)))                           as Tag
            from Meme
                     left join MemeCategory on Meme.idx = MemeCategory.memeIdx
                     left join Category on Category.idx = MemeCategory.categoryIdx
                     left join User on User.idx = Meme.userIdx
                     left join MemeTag on MemeTag.memeIdx = Meme.idx
                     left join Tag on MemeTag.tagIdx = Tag.idx
            where Meme.idx = ?;
                `;
        const memeDetailParams = [userId,memeIdx,memeIdx];
        const [memeDetailRows] = await connection.query(
            memeDetailQuery,
            memeDetailParams
        );

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
            group by Meme.idx limit 0,6;
        `;
        const similarMemeParams = [memeIdx,memeIdx];
        const [similarMemeRows] = await connection.query(
            similarMemeQuery,
            similarMemeParams
        );



        const updateViewQuery = `
        update Meme
set view = view + 1
where Meme.idx = ?;
        `;
        const updateViewParams = [memeIdx];
        const [updateViewRows] = await connection.query(
            updateViewQuery,
            updateViewParams
        );

        connection.commit();
        connection.release();

        return [memeDetailRows,similarMemeRows];

    } catch (err) {
        connection.rollback();
        connection.release();
        logger.error(`App - MemeDetail & updateView Transaction error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }

}


async function checkReportTagExist(reportTagIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const ReportTagExistQuery = `
            select exists(select idx,reportTagTitle from ReportTag where idx = ?) as exist;
        `;
        const ReportTagExistParams = [reportTagIdx];
        const [ReportTagExistRows] = await connection.query(
            ReportTagExistQuery,
            ReportTagExistParams
        );
        connection.release();

        return ReportTagExistRows[0].exist;
    } catch (err) {
        logger.error(`App - checkUserLikeMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function reportMeme(userId,memeIdx,reportTagIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const reportMemeQuery = `
            insert into Report (userIdx, memeIdx, tagIdx) values (?,?,?);
        `;
        const reportMemeParams = [userId,memeIdx,reportTagIdx];
        const [reportMemeRows] = await connection.query(
            reportMemeQuery,
            reportMemeParams
        );
        connection.release();

        return reportMemeRows;
    } catch (err) {
        logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

async function checkUserReport(userId,memeIdx) {
    try {
        const connection = await pool.getConnection(async (conn) => conn);
        const UserReportExistQuery = `
            select exists(select userIdx from Report where userIdx = ? and memeIdx = ?) as exist;
        `;
        const UserReportExistParams = [userId,memeIdx];
        const [UserReportExistRows] = await connection.query(
            UserReportExistQuery,
            UserReportExistParams
        );
        connection.release();

        return UserReportExistRows[0].exist;
    } catch (err) {
        logger.error(`App - checkUserLikeMeme DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

module.exports = {
    selectRecUserMeme,
    selectRecAllMeme,
    checkUserCategory,
    selectSimilarMeme,
    checkUserLikeMeme,
    dislikeMeme,
    likeMeme,
    checkUploader,
    deleteMeme,
    checkMemeExist,
    selectAllMeme,
    selectUserMeme,
    selectMemeDetail,
    checkReportTagExist,
    reportMeme,
    checkUserReport
};
