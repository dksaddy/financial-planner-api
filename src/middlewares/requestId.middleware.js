import { randomUUID } from "node:crypto";

// Tags every request with an id, echoed back as `X-Request-Id` and printed on
// the access log line and on any error logged for it, so a failure a user
// reports can be matched to the server log that explains it.
//
// A caller's own id is kept when it looks like one — a proxy in front may
// already have assigned it — and replaced otherwise, so a header cannot write
// arbitrary text into the logs.
const SAFE_ID = /^[A-Za-z0-9-]{8,64}$/;

const requestId = (req, res, next) => {
  const incoming = req.get("X-Request-Id");

  req.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();

  res.set("X-Request-Id", req.id);

  next();
};

export default requestId;
