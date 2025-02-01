import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductsCompany } from "./products-company.entity";
import { ProductsFormulaElement } from "./products-formula-element.entity";

@Entity("pro_element")
export class ProductsElement {
  
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
    () => ProductsCompany,
    (company) => company.element,
    {eager: true}
  )
  company: ProductsCompany;

  @OneToMany(
    () => ProductsFormulaElement,
    (formulaElement) => formulaElement.element
  )
  formulaElement: ProductsFormulaElement;
}
