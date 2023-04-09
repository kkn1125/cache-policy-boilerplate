export default class Cache {
  header;
  item;
  used;
  createdAt;
  updatedAt;
  expiredIn;

  constructor(header, item, expiredIn) {
    this.header = header;
    this.item = JSON.parse(item);
    this.used = 1;
    this.createdAt = Date.now();
    this.updatedAt = Date.now();
    this.expiredIn = Date.now() + expiredIn;
  }

  updateUsed() {
    this.used += 1;
    return this.toJSON();
  }

  updateTime() {
    this.updatedAt = Date.now();
    return this.toJSON();
  }

  toJSON() {
    return Object.assign({}, this);
  }
}
