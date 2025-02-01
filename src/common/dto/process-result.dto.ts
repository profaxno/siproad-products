export class ProcessResultDto {
  totalRows     : number = 0;
  rowsOK        : number = 0;
  rowsKO        : number = 0; 
  detailsRowsOK : string[] = [];
  detailsRowsKO : string[] = [];

  constructor(totalRows: number) {
    this.totalRows = totalRows;
  }
}