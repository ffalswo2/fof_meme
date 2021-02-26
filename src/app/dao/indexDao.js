const { pool } = require("../../../config/database");

// index
async function defaultDao() {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
                    SELECT id, email, nickname, createdAt, updatedAt 
                    FROM UserInfo `;

  const [rows] = await connection.query(selectEmailQuery)
  connection.release();

  return rows;
}

async function selectCategory() {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectCategoryQuery = `
                    select idx as categoryIdx, categoryTitle as title
from Category;`

  const [rows] = await connection.query(selectCategoryQuery)
  connection.release();

  return rows;
}

module.exports = {
  defaultDao,
  selectCategory
};
