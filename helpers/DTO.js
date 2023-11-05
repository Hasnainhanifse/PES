function ResponseResult(count, result) {
  if (!result || !result.length) {
    count = 0;
  }
  return {
    count: count,
    result: result,
  };
}

module.exports = ResponseResult;
