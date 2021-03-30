const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const searchDao = require('../dao/searchDao');


exports.getSearchMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;

    let {
        word, page, size
    } = req.query;

    if (!word) return res.json({ isSuccess: false, code: 300, message: "검색어를 입력해주세요" });
    if (word.replace(' ','') === '#') return res.json({ isSuccess: false, code: 305, message: "# 뒤에 문자를 입력해주세요" })
    if (word.length > 15) return res.json({ isSuccess: false, code: 301, message: "검색어를 15자 미만으로 줄여주세요" });
    if (!page) return res.json({ isSuccess: false, code: 302, message: "페이지를 입력해주세요" });
    if (!size) return res.json({ isSuccess: false, code: 303, message: "사이즈를 입력해주세요" });
    if (page < 1) return res.json({ isSuccess: false, code: 304, message: "페이지 번호를 다시 확인해주세요" });

    page = size * (page-1);
    let firstWord = word.substr(0,1);

    if (firstWord === '#') { // 태그 검색이라면
        word = word.substring(1,)

        try {
            const tagSearchRows = await searchDao.searchMemeByTag(word, page, size);

            // if (tagSearchRows.length ) {
            //     return res.json({
            //         isSuccess: false,
            //         code: 320,
            //         message: "밈 태그 검색 결과 조회 실패"
            //     });
            // }
            // {countProduct: searchRows[0][0].countProduct, productList: searchRows[1]}
            res.json({
                data: tagSearchRows,
                isSuccess: true,
                code: 201,
                message: "밈 태그 검색 결과 조회 성공"
            });
        } catch (err) {
            logger.error(`App - getTagSearchMeme Query error\n: ${JSON.stringify(err)}`);
            return false;
        }

    } else { // 카테고리 검색
        try {
            const categorySearchRows = await searchDao.searchMemeByCategory(word, page, size);

            if (!categorySearchRows) {
                return res.json({
                    isSuccess: false,
                    code: 305,
                    message: "밈 카테고리 검색 결과 조회 실패"
                });
            }

            // {countProduct: searchRows[0][0].countProduct, productList: searchRows[1]}
            res.json({
                data: categorySearchRows,
                isSuccess: true,
                code: 200,
                message: "밈 카테고리 검색 결과 조회 성공"
            });
        } catch (err) {
            logger.error(`App - getCategorySearchMeme Query error\n: ${JSON.stringify(err)}`);
            return false;
        }
    }

}

exports.getTrendCategoryMeme = async function (req, res) {
    const userId = req.verifiedToken.userId;

    const {
        categoryIdx
    } = req.params;

    if (!categoryIdx) return res.json({ isSuccess: false, code: 303, message: "카테고리 아이디값을 입력해주세요" });

    try {
        const checkCategoryExist = await searchDao.checkCategoryExist(categoryIdx);

        if (checkCategoryExist) { // 카테고리 아이디값이 존재한다면
            const categoryTopMeme = await searchDao.selectCategoryTopMeme(categoryIdx);

            if (!categoryTopMeme) {
                res.json({
                    isSuccess: false,
                    code: 300,
                    message: "카테고리별 조회수 탑5 밈 조회 실패"
                });
            }

            res.json({
                data: {updateTime : categoryTopMeme[1][0].updateTime,memeList : categoryTopMeme[0]},
                isSuccess: true,
                code: 200,
                message: "카테고리별 조회수 탑5 밈 조회 성공"
            });

        } else { // 카테고리가 없는 카테고리라면
            res.json({
                isSuccess: false,
                code: 330,
                message: "존재하지 않는 카테고리 입니다"
            });
        }

        logger.debug('카테고리별 조회수 탑 밈 조회 요청 성공');
    } catch (err) {
        logger.error(`App - getTrendCategoryMeme Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getTrendTag = async function (req, res) {
    const userId = req.verifiedToken.userId;

    try {
        const trendTagRows = await searchDao.selectTrendTag();

        if (!trendTagRows) {
            res.json({
                isSuccess: false,
                code: 300,
                message: "트랜드 해쉬태그 조회 실패"
            });
        }

        res.json({
            data: {updateTime : trendTagRows[1][0].updateTime,tagList : trendTagRows[0]},
            isSuccess: true,
            code: 200,
            message: "트렌드 해쉬태그 조회 성공"
        });

        logger.debug('트랜드 해쉬태그 조회 요청 성공');
    } catch (err) {
        logger.error(`App - getTrendTag Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getMemeByTagIdx = async function (req, res) {
    const userId = req.verifiedToken.userId;

    const {
        tagIdx
    } = req.params;

    if (!tagIdx) return res.json({ isSuccess: false, code: 303, message: "태그 아이디값을 입력해주세요" });

    try {
        const checkTagExist = await searchDao.checkTagExist(tagIdx);

        if (checkTagExist) { // 태그 아이디값이 존재한다면
            const searchMemeByTagIdx = await searchDao.selectMemeByTagIdx(tagIdx);

            // if (searchMemeByTagIdx.length < 1) {
            //     res.json({
            //         isSuccess: false,
            //         code: 300,
            //         message: "태그 아이디를 통한 밈 검색 실패"
            //     });
            // }

            res.json({
                data: {memeCount : searchMemeByTagIdx[1][0].memeCount,memeList : searchMemeByTagIdx[0]},
                isSuccess: true,
                code: 200,
                message: "태그 아이디를 통한 밈 검색 성공"
            });

        } else { // 태그가 없는 태그라면
            res.json({
                isSuccess: false,
                code: 330,
                message: "존재하지 않는 태그입니다"
            });
        }

        logger.debug('태그 통한 밈 검색 요청 성공');
    } catch (err) {
        logger.error(`App - getMemeByTagIdx Query error\n: ${JSON.stringify(err)}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
}

exports.getTagByName = async function (req, res) {
    const userId = req.verifiedToken.userId;

    let {
        word
    } = req.query;

    if (!word) return res.json({ isSuccess: false, code: 301, message: "검색어를 입력해주세요" });
    if (word.length > 15) return res.json({ isSuccess: false, code: 302, message: "검색어를 15자 미만으로 줄여주세요" });
    let firstWord = word.substr(0,1);

    if (firstWord !== '#') return res.json({ isSuccess: false, code: 343, message: "해쉬 태그는 앞에 '#'을 붙여주세요" });
    word = word.substring(1,)

    try {
        const tagRows = await searchDao.searchTagByName(word);

        if (!tagRows) {
            return res.json({
                isSuccess: false,
                code: 300,
                message: "태그 검색 결과 조회 실패"
            });
        }

        // {countProduct: searchRows[0][0].countProduct, productList: searchRows[1]}
        res.json({
            data: tagRows,
            isSuccess: true,
            code: 200,
            message: "태그 검색 결과 조회 성공"
        });
    } catch (err) {
        logger.error(`App - getTagByName Query error\n: ${JSON.stringify(err)}`);
        return false;
    }
}
