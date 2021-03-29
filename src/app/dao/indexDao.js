const { pool } = require("../../../config/database");

// index
async function defaultDao() {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectEmailQuery = `
                    SELECT id, email, nickname, createdAt, updatedAt 
                    FROM UserInfo `;

    const [rows] = await connection.query(selectEmailQuery)
    connection.release();

    return rows;
  } catch (err) {
    connection.release();
    logger.error(`App - defaultDao DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }

}

async function selectCategory() {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const selectCategoryQuery = `
                    select idx as categoryIdx, categoryTitle as title
from Category;`

    const [rows] = await connection.query(selectCategoryQuery)
    connection.release();

    return rows;
  } catch (err) {
    connection.release();
    logger.error(`App - selectCategory DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }

}

async function selectReportTag() {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const getReportTagQuery = `
    select idx,reportTagTitle from ReportTag;
    `

    const [ReportRows] = await connection.query(getReportTagQuery)
    connection.release();

    return ReportRows;
  } catch (err) {
    connection.release();
    logger.error(`App - selectReportTag DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }

}

async function selectTag() {
  try {
    const connection = await pool.getConnection(async (conn) => conn);
    const getReportTagQuery = `
    select idx as tagIdx,concat('#',tagName) as tagName from Tag order by rand() limit 8;
    `

    const [ReportRows] = await connection.query(getReportTagQuery)
    connection.release();

    return ReportRows;
  } catch (err) {
    connection.release();
    logger.error(`App - selectTag DB Connection error\n: ${err.message}`);
    return res.status(500).send(`Error: ${err.message}`);
  }

}

module.exports = {
  defaultDao,
  selectCategory,
  selectReportTag,
  selectTag
};
