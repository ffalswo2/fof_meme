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
    const insertUserCategoryQuery = `
      insert into UserCategory (userIdx,categoryIdx)
      values (?,?);
        `;
    const insertUserCategoryParams = [userId,categoryIdx];
    const [userCategoryRows] = await connection.query(
        insertUserCategoryQuery,
        insertUserCategoryParams
    );
    connection.release();

    return userCategoryRows;
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

module.exports = {
  userEmailCheck,
  userNicknameCheck,
  insertUserInfo,
  selectUserInfo,
  setUserCategory,
  deleteUser
};
