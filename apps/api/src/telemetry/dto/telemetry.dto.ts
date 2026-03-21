import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PointDto {
    @ApiProperty({ example: '2024-03-10T10:00:00Z' })
    @IsDateString()
    @IsNotEmpty()
    recordedAt: string;

    @ApiProperty({ example: 12.9716 })
    @IsNumber()
    @IsNotEmpty()
    latitude: number;

    @ApiProperty({ example: 77.5946 })
    @IsNumber()
    @IsNotEmpty()
    longitude: number;

    @ApiProperty({ example: 45.2, required: false })
    @IsNumber()
    @IsOptional()
    speedKmph?: number;

    @ApiProperty({ example: 180.5, required: false })
    @IsNumber()
    @IsOptional()
    headingDeg?: number;

    @ApiProperty({ example: 4, required: false, description: '1=No fix, 2=2D, 3=3D, 4=DGPS, 5=PPK' })
    @IsNumber()
    @IsOptional()
    gpsFixQuality?: number;
    
    @ApiProperty({ example: true, required: false })
    @IsOptional()
    sprayActive?: boolean;

    @ApiProperty({ example: [1, 2], required: false })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    valveStates?: number[];

    @ApiProperty({ example: 'Rust', required: false })
    @IsString()
    @IsOptional()
    diseaseLabel?: string;

    @ApiProperty({ example: 0.85, required: false })
    @IsNumber()
    @IsOptional()
    infectionIntensity?: number;

    @ApiProperty({ example: 0.8, required: false })
    @IsNumber()
    @IsOptional()
    heatWeight?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    extra?: any;
}

export class BatchTelemetryDto {
    @ApiProperty({ example: 'uuid-of-tractor' })
    @IsString()
    @IsNotEmpty()
    tractorId: string;

    @ApiProperty({ example: 'uuid-of-job' })
    @IsString()
    @IsNotEmpty()
    jobId: string;

    @ApiProperty({ type: [PointDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PointDto)
    points: PointDto[];
}
