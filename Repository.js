import User from "./User.js";

export class Repository {
  name;
  pk = 0;
  database;
  constructor(repoName, database) {
    this.name = repoName;
    this.database = database || [];
  }

  responseDelay(name, data) {
    console.log(`[📢 Delay Response] ${name}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(data);
      }, 500);
    });
  }

  async findAll() {
    return this.responseDelay("findAll", this.database);
  }

  async findOne(id) {
    const found = await this.responseDelay(
      "findOne",
      this.database.find((db) => db.id === Number(id))
    );
    if (!found) throw new Error("not found");
    return found;
  }

  async insert(data) {
    const newData = {
      id: (this.pk += 1),
      ...data,
    };
    let pushData;
    switch (this.name) {
      case "user":
        pushData = new User(newData);
        break;
      default:
        pushData = newData;
        break;
    }
    this.database.push(pushData);
    return this.responseDelay("insert", newData);
  }

  async update(id, data) {
    const foundUser = this.database.find((db) => db.id === Number(id));
    if (!foundUser) throw new Error("not found");
    return this.responseDelay("update", Object.assign(foundUser, data || {}));
  }

  async delete(id) {
    const foundUser = this.database.find((db) => db.id === Number(id));
    if (!foundUser) throw new Error("not found");

    this.database = this.database.filter((db) => db.id !== Number(id));
    return this.responseDelay("delete", true);
  }
}

export default class Database {
  /** @type {Repository[]} */ databases;

  constructor(databaseNames) {
    this.databases = new Map();
    databaseNames.forEach((name) => {
      this.databases.set(name, new Repository(name, []));
    });
  }

  /** @returns {Repository} */
  getDB(name) {
    return this.databases.get(name);
  }
}
