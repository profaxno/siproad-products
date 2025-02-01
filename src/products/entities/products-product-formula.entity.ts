import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductsFormula } from "./products-formula.entity";
import { ProductsProduct } from "./products-product.entity";

@Entity("pro_product_formula")
export class ProductsProductFormula {
  
  @PrimaryGeneratedColumn()
  id: number;

  @Column('double')
  qty: number;
  
  @ManyToOne(
    () => ProductsFormula,
    (formula) => formula.productFormula,
  )
  formula: ProductsFormula;

  @ManyToOne(
    () => ProductsProduct,
    (product) => product.productFormula,
    {eager: true}
  )
  product: ProductsProduct;

}
