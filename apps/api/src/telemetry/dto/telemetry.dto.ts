import { IsString, IsNotEmpty, IsArray, ValidateNested, IsOptional, IsNumber, IsDateString, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PointDto {
    @ApiProperty({ example: '2024-03-10T10:00:00Z' })
    @IsDateString() @IsNotEmpty() recordedAt: string;

    @ApiProperty({ example: 12.9716 }) @IsNumber() @IsNotEmpty() latitude: number;
    @ApiProperty({ example: 77.5946 }) @IsNumber() @IsNotEmpty() longitude: number;

    @ApiProperty({ required: false }) @IsNumber() @IsOptional() speedKmph?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() headingDeg?: number;
    
    @ApiProperty({ required: false }) @IsBoolean() @IsOptional() sprayActive?: boolean;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() infectionIntensity?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() heatWeight?: number;
    
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() gpsAccuracyMeters?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() gpsFixQuality?: number;
}

export class EventDto {
    @ApiProperty() @IsDateString() @IsNotEmpty() recordedAt: string;
    
    @ApiProperty({ required: false }) @IsArray() @IsNumber({}, { each: true }) @IsOptional() valveStates?: number[];
    @ApiProperty({ required: false }) @IsString() @IsOptional() diseaseLabel?: string;
    @ApiProperty({ required: false }) @IsBoolean() @IsOptional() targetAcquired?: boolean;
    @ApiProperty({ required: false }) @IsString() @IsOptional() sprayEventId?: string;
    @ApiProperty({ required: false }) @IsString() @IsOptional() sprayTriggerReason?: string;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() valveOpenDurationMs?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() actuationLatencyMs?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() coveredAreaM2?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() rowIndex?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() estimatedTimeLeft?: number;
    @ApiProperty({ required: false }) @IsOptional() extra?: any;
}

export class HealthDto {
    @ApiProperty() @IsDateString() @IsNotEmpty() recordedAt: string;

    @ApiProperty({ required: false }) @IsNumber() @IsOptional() numSatellites?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() classifierConf?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() targetDepthM?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() depthConfidence?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() cpuTempC?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() cpuUsagePct?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() memUsagePct?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() frameDropCount?: number;
    @ApiProperty({ required: false }) @IsNumber() @IsOptional() uptime?: number;
    @ApiProperty({ required: false }) @IsOptional() diagnostics?: any;
}

export class BatchTelemetryDto {
    @ApiProperty() @IsString() @IsNotEmpty() tractorId: string;
    @ApiProperty() @IsString() @IsNotEmpty() jobId: string;
    @ApiProperty({ required: false }) @IsDateString() @IsOptional() sessionStartedAt?: string;

    @ApiProperty({ type: [PointDto], required: false })
    @IsArray() @ValidateNested({ each: true }) @Type(() => PointDto) @IsOptional() points?: PointDto[];

    @ApiProperty({ type: [EventDto], required: false })
    @IsArray() @ValidateNested({ each: true }) @Type(() => EventDto) @IsOptional() events?: EventDto[];

    @ApiProperty({ type: [HealthDto], required: false })
    @IsArray() @ValidateNested({ each: true }) @Type(() => HealthDto) @IsOptional() health?: HealthDto[];
}
