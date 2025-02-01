import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Company } from "./company.entity";
import { FormulaElement } from "./formula-element.entity";

@Entity("pro_element")
export class Element {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { 
    length: 45,
    unique: true
  })
  name: string;

  @Column('double')
  cost: number;

  @Column('double')
  stock: number;

  @Column('varchar', { 
    length: 5,
    unique: true
  })
  unit: string;

  // TODO: falta agregar createAt y UpdatedAt

  @Column('boolean', {
    default: true
  })
  status: boolean

  @ManyToOne(
    () => Company,
    (company) => company.element,
    {eager: true}
  )
  company: Company;

  @OneToMany(
    () => FormulaElement,
    (formulaElement) => formulaElement.element
  )
  formulaElement: FormulaElement;
}
