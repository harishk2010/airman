const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const getPaginatedResponse = (data, count, page, limit) => ({
  data,
  pagination: {
    total: count,
    page,
    limit,
    totalPages: Math.ceil(count / limit),
    hasNext: page * limit < count,
    hasPrev: page > 1,
  },
});

module.exports = { getPagination, getPaginatedResponse };
