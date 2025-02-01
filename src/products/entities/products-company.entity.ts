import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { ProductsElement } from "./products-element.entity";
import { ProductsFormula } from "./products-formula.entity";
import { ProductsProduct } from "./products-product.entity";

@Entity("gen_company")
export class ProductsCompany {
  
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
    () => ProductsElement,
    (element) => element.company
  )
  element: ProductsElement;

  @OneToMany(
    () => ProductsFormula,
    (formula) => formula.company
  )
  formula: ProductsFormula;

  @OneToMany(
    () => ProductsProduct,
    (product) => product.company
  )
  product: ProductsProduct;
}
