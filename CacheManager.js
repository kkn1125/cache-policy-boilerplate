import Cache from "./Cache.js";
import schedule from "node-schedule";

export default class CacheManager {
  /** @type {{[k: string]: Cache}} */ store;
  policy;
  usedGap = 3;
  expiredTime = 1000 * 60 * 60 * 24 * 1;

  constructor(expiredTime) {
    this.store = {};
    this.policy = {};
    this.expiredTime = expiredTime || this.expiredTime;
    this.#startCheckPolicies();
  }

  #startCheckPolicies() {
    /* policy check */
    schedule.scheduleJob(
      "*/5 * * * * *",
      function () {
        console.log("[💻 Policy check]");
        this.validation();
      }.bind(this)
    );
  }

  initialize(key) {
    Object.entries(this.store).forEach(([k, v]) => {
      if (k.match(key)) {
        console.log(`[❌ initialize match store]: cache in ${key} => delete ${k}`);
        delete this.store[k];
      }
    });
  }

  updateCacheData(key) {
    const oldData = this.store[key];
    oldData.updateUsed();
    oldData.updateTime();
    return oldData;
  }

  hasCache(key) {
    return !!this.store[key];
  }

  read(req) {
    const { method, url } = req;
    const header = `${method}|${url}`;
    const item = this.store[header]?.item;
    if (item) {
      console.log("[🚀 Quick Response]", item);
    }
    return item;
  }

  save(key, value) {
    const [method, url] = key.split("|");
    const cacheHeader = { method, url };
    this.store[key] = new Cache(cacheHeader, value, this.expiredTime);
  }

  delete(key) {
    delete this.store[key];
  }

  update(key, newValue) {
    this.store[key] = newValue;
  }

  addPolicy(
    /** @type {string} */ name,
    /** @type {(this: CacheManager, name: string) => void} */ feature
  ) {
    this.policy[name] = feature.bind(
      /** @type {CacheManager} */ this,
      /** @type {string} */ name
    );
  }

  deletePolicy(name) {
    delete this.policy[name];
  }

  validation() {
    if (Object.keys(this.policy).length > 0) {
      Object.entries(this.policy).forEach(([name, policy]) => policy());
    } else {
      console.log("no policy");
    }
  }
}
