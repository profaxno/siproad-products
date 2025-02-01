import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsPositive, Min } from "class-validator";

export class PaginationDto{
    @IsOptional()
    @IsPositive()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @IsOptional()
    @IsPositive()
    @Min(1)
    @Type(() => Number)
    limit?: number;
}