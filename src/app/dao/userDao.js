const { pool } = require("../../../config/database");

// Signup
async function userEmailCheck(email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
                SELECT email, nickName 
                FROM User 
                WHERE email = ? and status = 'ACTIVE';
                `;
  const selectEmailParams = [email];
  const [emailRows] = await connection.query(
      selectEmailQuery,
      selectEmailParams
  );
  connection.release();

  return emailRows;
}

async function userNicknameCheck(nickname) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectNicknameQuery = `
                SELECT email, nickName 
                FROM User 
                WHERE nickName = ?;
                `;
  const selectNicknameParams = [nickname];
  const [nicknameRows] = await connection.query(
      selectNicknameQuery,
      selectNicknameParams
  );
  connection.release();
  return nicknameRows;
}

async function insertUserInfo(insertUserInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserInfoQuery = `
        INSERT INTO User(email, password, nickName)
        VALUES (?, ?, ?);
    `;
  const insertUserInfoRow = await connection.query(
      insertUserInfoQuery,
      insertUserInfoParams
  );
  connection.release();
  return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(email) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectUserInfoQuery = `
        select idx, email, password, status from User where email = ?;
        `;
    const selectUserInfoParams = [email];
    const [userInfoRows] = await connection.query(
        selectUserInfoQuery,
        selectUserInfoParams
    );
    connection.release();

    return userInfoRows;
  } catch (err) {
    logger.error(`App - SignIn DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function setUserCategory(userId,categoryIdx) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    await connection.beginTransaction();

    for (let i=0; i<categoryIdx.length; i++) {
      const insertUserCategoryQuery = `
      insert into UserCategory (userIdx,categoryIdx)
      values (?,?);
        `;
      const insertUserCategoryParams = [userId,categoryIdx[i]];
      const [userCategoryRows] = await connection.query(
          insertUserCategoryQuery,
          insertUserCategoryParams
      );

    }

    connection.commit();
    connection.release();

  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function transUserCategory(userId,categoryIdx) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    await connection.beginTransaction();

    const deleteUserCategoryQuery = `
      delete from UserCategory where UserCategory.userIdx = ?;
        `;
    const deleteUserCategoryParams = [userId];
    const [deleteUserCategoryRows] = await connection.query(
        deleteUserCategoryQuery,
        deleteUserCategoryParams
    );

    for (let i=0; i<categoryIdx.length; i++) {
      const insertUserCategoryQuery = `
      insert into UserCategory (userIdx,categoryIdx)
      values (?,?);
        `;
      const insertUserCategoryParams = [userId,categoryIdx[i]];
      const [userCategoryRows] = await connection.query(
          insertUserCategoryQuery,
          insertUserCategoryParams
      );

    }

    connection.commit();
    connection.release();

  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}


async function deleteUser(userId) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const deleteUserQuery = `
      update User
      set status = 'DELETED'
      where User.idx = ?;
        `;
    const deleteUserParams = [userId];
    const [deleteUserRows] = await connection.query(
        deleteUserQuery,
        deleteUserParams
    );
    connection.release();

    return deleteUserRows;
  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function getUserProfile(userId) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    const userProfileQuery = `
      select profileImage,
             nickName as nickname,
             (select count(*)
              from \`Like\`
                     join Picture on Picture.idx = \`Like\`.memeIdx
              where Picture.userIdx = ?)                                as acceptedLikeCnt,
             (select count(idx) from Picture where Picture.userIdx = ?)    as uploadCnt,
             (select count(memeIdx) from \`Like\` where userIdx = ?) as likeCnt
      from User
      where User.idx = ?;
        `;
    const userProfileParams = [userId,userId,userId,userId];
    const [userProfileRows] = await connection.query(
        userProfileQuery,
        userProfileParams
    );

    const userInsightQuery = `
      select count(Tag.idx) as cnt, concat('#',tagName) as tagName
      from Tag
             left join MemeTag on Tag.idx = MemeTag.tagIdx
             left join Picture on Picture.idx = MemeTag.memeIdx
             left join \`Like\` on \`Like\`.memeIdx = Picture.idx
      where \`Like\`.userIdx = ?
         or Picture.userIdx = ?
      group by Tag.idx
      order by cnt desc limit 5;
        `;
    const userInsightParams = [userId,userId];
    const [userInsightRows] = await connection.query(
        userInsightQuery,
        userInsightParams
    );

    connection.release();

    return [userProfileRows,userInsightRows];
  } catch (err) {
    logger.error(`App - UserProfile DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function selectUploadedMeme(userId,page,size) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    const userUploadQuery = `
      select idx as memeIdx,imageUrl from Picture where Picture.userIdx = ? limit `+page+`, `+size+`;
        `;
    const userUploadParams = [userId,page,size];
    const [userUploadRows] = await connection.query(
        userUploadQuery,
        userUploadParams
    );

    connection.release();

    return userUploadRows;
  } catch (err) {
    logger.error(`App - UserProfile DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function selectUserFavMeme(userId,page,size) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);

    const selectUserFavQuery = `
      select memeIdx, imageUrl
      from \`Like\`
             join Picture on \`Like\`.memeIdx = Picture.idx
      where \`Like\`.userIdx = ? limit `+page+`, `+size+`;
        `;
    const selectUserFavParams = [userId,page,size];
    const [selectUserFavRows] = await connection.query(
        selectUserFavQuery,
        selectUserFavParams
    );

    connection.release();

    return selectUserFavRows;
  } catch (err) {
    logger.error(`App - UserProfile DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function updateUserEmailNickname(userId,email,nickname) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateUserQuery = `
      update User set email = ?,nickName = ? where User.idx = ?;
        `;
    const updateUserParams = [email,nickname,userId];
    const [updateUserRows] = await connection.query(
        updateUserQuery,
        updateUserParams
    );
    connection.release();

    return updateUserRows;
  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function updateUserEmail(userId,email) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateUserQuery = `
      update User
      set email = ?
      where User.idx = ?;        `;
    const updateUserParams = [email,userId];
    const [updateUserRows] = await connection.query(
        updateUserQuery,
        updateUserParams
    );
    connection.release();

    return updateUserRows;
  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function updateUserNickname(userId,nickname) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const updateUserQuery = `
      update User
      set nickName = ?
      where User.idx = ?;        `;
    const updateUserParams = [nickname,userId];
    const [updateUserRows] = await connection.query(
        updateUserQuery,
        updateUserParams
    );
    connection.release();

    return updateUserRows;
  } catch (err) {
    logger.error(`App - UserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

async function changeUserPw(insertUserInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserInfoQuery = `
    update User set password = ? where User.idx = ?;
    `;
  const insertUserInfoRow = await connection.query(
      insertUserInfoQuery,
      insertUserInfoParams
  );
  connection.release();
  return insertUserInfoRow;
}

async function checkUserCategory(userId) {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const UserCategoryExistQuery = `
            select exists(select userIdx from UserCategory where userIdx = ?) as exist;
        `;
    const UserCategoryExistParams = [userId];
    const [UserCategoryExistRows] = await connection.query(
        UserCategoryExistQuery,
        UserCategoryExistParams
    );
    connection.release();

    return UserCategoryExistRows[0].exist;
  } catch (err) {
    logger.error(`App - checkUserCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }
}

module.exports = {
  userEmailCheck,
  userNicknameCheck,
  insertUserInfo,
  selectUserInfo,
  setUserCategory,
  deleteUser,
  getUserProfile,
  selectUploadedMeme,
  selectUserFavMeme,
  updateUserEmailNickname,
  updateUserEmail,
  updateUserNickname,
  changeUserPw,
  transUserCategory,
  checkUserCategory
};
