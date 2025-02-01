export class productsResponseDto {
  internalCode: number;
  message: string;
  payload?: any;

  constructor(internalCode: number, message: string, payload?: any) {
    this.internalCode = internalCode;
    this.message = message;
    this.payload = payload;
  }
}