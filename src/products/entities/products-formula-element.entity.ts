import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductsElement } from "./products-element.entity";
import { ProductsFormula } from "./products-formula.entity";

@Entity("pro_formula_element")
export class ProductsFormulaElement {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column('double')
  qty: number;

  @ManyToOne(
    () => ProductsElement,
    (element) => element.formulaElement,
    {eager: true}
  )
  element: ProductsElement;

  @ManyToOne(
    () => ProductsFormula,
    (formula) => formula.formulaElement,
  )
  formula: ProductsFormula;
}
