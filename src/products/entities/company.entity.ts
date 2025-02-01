import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Element } from "./element.entity";
import { Formula } from "./formula.entity";
import { Product } from "./product.entity";

@Entity("gen_company")
export class Company {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { 
    length: 45,
    unique: true
  })
  name: string;

  // TODO: falta agregar createAt y UpdatedAt

  @Column('boolean', {
    default: true
  })
  status: boolean

  @OneToMany(
    () => Element,
    (element) => element.company
  )
  element: Element;

  @OneToMany(
    () => Formula,
    (formula) => formula.company
  )
  formula: Formula;

  @OneToMany(
    () => Product,
    (product) => product.company
  )
  product: Product;
}
