class ApiResponse {
  // `meta` carries everything that describes the response rather than being
  // the response — pagination, filter summaries. It is omitted entirely when
  // not given, so existing endpoints keep their exact payload shape.
  constructor(statusCode, message, data = null, meta = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    if (meta !== null) {
      this.meta = meta;
    }
  }
}

export default ApiResponse;
