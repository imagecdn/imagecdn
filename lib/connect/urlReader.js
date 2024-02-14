import { parse } from "url";
import querystring from "querystring";

export default function urlReader(req, res, next) {
  const { query } = parse(req.url);
  req.query = querystring.parse(query);
  return next();
}
