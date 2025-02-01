import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ProductsCompany } from "./products-company.entity";
import { ProductsFormulaElement } from "./products-formula-element.entity";
import { ProductsProductFormula } from "./products-product-formula.entity";

@Entity("pro_product")
export class ProductsProduct {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { 
    length: 45,
    unique: true
  })
  name: string;

  @Column('varchar', { 
    length: 255
  })
  description: string;

  @Column('double')
  cost: number;

  @Column('double')
  price: number;

  // TODO: falta agregar createAt y UpdatedAt

  @Column('boolean', {
    default: true
  })
  status: boolean

  @ManyToOne(
    () => ProductsCompany,
    (company) => company.product,
    {eager: true}
  )
  company: ProductsCompany;

  @OneToMany(
    () => ProductsProductFormula,
    (productFormula) => productFormula.product
  )
  productFormula: ProductsProductFormula;
}
