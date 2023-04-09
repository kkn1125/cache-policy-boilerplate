import fastify from "fastify";
import CacheManager from "./CacheManager.js";
import Database from "./Repository.js";

/* server settings */
const server = fastify({
  logger: {
    serializers: {
      res(reply) {
        // The default
        return {
          statusCode: reply.statusCode,
        };
      },
      req(request) {
        return {
          method: request.method,
          url: request.url,
          hostname: request.hostname,
          query: request.query,
          body: request.body,
        };
      },
    },
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "HH:MM:ss Z",
        ignore: "pid,hostname,reqId",
      },
    },
  },
});

/* database */
const db = new Database(["user"]);
const userRepository = db.getDB("user");

/* cache manager */
const cacheManager = new CacheManager();
cacheManager.addPolicy("LFU", function (name) {
  console.log(`[Policy ${name}] check start!`);
  const compare = {
    min: undefined,
    max: undefined,
  };
  Object.entries(this.store).forEach(([db, cache]) => {
    console.log("[Cache]:", cache);
    if (!compare.max) compare.max = cache;
    if (!compare.min) compare.min = cache;

    if (cache.used > compare.max.used) {
      compare.max = cache;
    }
    if (cache.used < compare.min.used) {
      compare.min = cache;
    }
  });
  console.log(compare); // 비교 객체 확인

  if (
    compare.max !== compare.min &&
    compare.max.used - compare.min.used > cacheManager.usedGap
  ) {
    console.log("[Over limit used count]");
    const { method, url } = compare.min.header;
    cacheManager.delete(`${method}|${url}`);
  }
});

server.addHook("onSend", (req, res, payload, done) => {
  const { method, url } = req;
  const header = `${method}|${url}`;
  const isExists = cacheManager.hasCache(header);
  if (req.method === "GET") {
    if (!isExists) {
      cacheManager.save(header, payload);
      console.log("[🚀 Save Cache!]", payload);
    } else {
      cacheManager.updateCacheData(header);
    }
  }
  done();
});

server.get("/api/user", async (req, res) => {
  /* cache injection */
  const cache = cacheManager.read(req);
  if (cache) return cache;

  const users = await userRepository.findAll();
  return { ok: true, payload: users };
});
server.get("/api/user/:id", async (req, res) => {
  const { params } = req;
  try {
    /* cache injection */
    const cache = cacheManager.read(req);
    if (cache) return cache;

    const user = await userRepository.findOne(params.id);
    return { ok: true, payload: user };
  } catch (e) {
    res.status(404).send(
      JSON.stringify({
        ok: false,
        message: "user not found id :" + params.id,
      })
    );
  }
});
server.post("/api/user", async (req, res) => {
  const { params } = req;
  try {
    cacheManager.initialize("user");

    const createdUser = await userRepository.insert(req.body);
    return { ok: true, payload: createdUser };
  } catch (e) {
    res.status(404).send(
      JSON.stringify({
        ok: false,
        message: "user not found id :" + params.id,
      })
    );
  }
});
server.put("/api/user/:id", async (req, res) => {
  const { params } = req;
  try {
    cacheManager.initialize("user");

    const updatedUser = await userRepository.update(params.id, req.body);
    return { ok: true, payload: updatedUser };
  } catch (e) {
    res.status(404).send(
      JSON.stringify({
        ok: false,
        message: "user not found id :" + params.id,
      })
    );
  }
});
server.delete("/api/user/:id", async (req, res) => {
  const { params } = req;
  try {
    cacheManager.initialize("user");

    await userRepository.delete(params.id);
    return { ok: true };
  } catch (e) {
    res.status(404).send(
      JSON.stringify({
        ok: false,
        message: "user not found id :" + params.id,
      })
    );
  }
});

server.listen(
  {
    host: "0.0.0.0",
    port: 5000,
  },
  () => {
    console.log("server listening on port 5000");
  }
);
