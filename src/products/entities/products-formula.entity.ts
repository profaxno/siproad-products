import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductsCompany } from "./products-company.entity";
import { ProductsFormulaElement } from "./products-formula-element.entity";
import { ProductsProductFormula } from "./products-product-formula.entity";

@Entity("pro_formula")
export class ProductsFormula {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { 
    length: 45,
    unique: true
  })
  name: string;

  @Column('double')
  cost: number;

  // TODO: falta agregar createAt y UpdatedAt

  @Column('boolean', {
    default: true
  })
  status: boolean

  @ManyToOne(
    () => ProductsCompany,
    (company) => company.formula,
    {eager: true}
  )
  company: ProductsCompany;

  @OneToMany(
    () => ProductsFormulaElement,
    (formulaElement) => formulaElement.formula,
    {eager: true}
  )
  formulaElement: ProductsFormulaElement[];

  @OneToMany(
    () => ProductsProductFormula,
    (productFormula) => productFormula.product
  )
  productFormula: ProductsProductFormula;
}
