export default class User {
  id;
  name;
  age;
  hobby;
  gender;

  constructor({id, name, age, gender, hobby}) {
    this.id = id;
    this.name = name;
    this.age = age;
    this.gender = gender;
    this.hobby = hobby;
  }

  toJSON() {
    return Object.assign({}, this);
  }
}
