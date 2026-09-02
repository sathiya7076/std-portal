/**
 * Parses page/limit query params into safe pagination values
 * and builds a meta object describing the result set.
 * @param {object} query express req.query
 */
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds a meta object for paginated responses.
 * @param {number} total total matching documents
 * @param {number} page current page
 * @param {number} limit page size
 */
const buildMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});

module.exports = { getPagination, buildMeta };
