import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export enum ArtifactTypeDto {
  ARCHITECTURE = 'ARCHITECTURE',
  ERD = 'ERD',
  WIREFRAME = 'WIREFRAME',
  FLOWCHART = 'FLOWCHART',
  SEQUENCE = 'SEQUENCE',
}

export class CreateDesignArtifactDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  projectId!: string

  @ApiProperty({ enum: ArtifactTypeDto })
  @IsEnum(ArtifactTypeDto)
  type!: ArtifactTypeDto

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title!: string

  @ApiPropertyOptional({ description: 'Mermaid source code (for ARCHITECTURE/ERD/SEQUENCE/FLOWCHART)' })
  @IsString()
  @IsOptional()
  mermaidCode?: string

  @ApiPropertyOptional({ description: 'Figma share link (for WIREFRAME)' })
  @IsString()
  @IsOptional()
  figmaUrl?: string
}

export class UpdateDesignArtifactDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  mermaidCode?: string

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  figmaUrl?: string
}
