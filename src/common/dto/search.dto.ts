import { IsArray, IsOptional, IsString } from "class-validator";

export class SearchDto{
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    searchList?: string[];

    constructor(search?: string, searchList?: string[]){
        this.search = search;
        this.searchList = searchList;
    }
}