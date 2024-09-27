export class Empleado {
    constructor(_id = "", name = "", position = "", office = "", salary = 0) {
        this._id = _id;
        this.name = name;
        this.position = position;
        this.office = office;
        this.salary = salary;
      }
      
    _id: string; // Sub guión id porque los datos van a venir de MOngodb
    name: string;
    position: string;
    office: string;
    salary: number;

}
