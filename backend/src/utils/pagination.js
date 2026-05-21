/**
 * Pagination Helper
 * Returns skip/limit values and metadata for paginated queries
 */
const getPagination = (query) => {
  const page  = Math.max(1, parseInt(query.page)  || 1);
  const limit = Math.min(50, parseInt(query.limit) || 12);
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

const getPaginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1,
});

module.exports = { getPagination, getPaginationMeta };
