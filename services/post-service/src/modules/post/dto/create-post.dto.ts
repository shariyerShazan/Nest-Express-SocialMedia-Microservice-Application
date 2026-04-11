import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The content text of the post', maxLength: 1000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @ApiPropertyOptional({ description: 'Optional image URL for the post' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdatePostDto {
  @ApiPropertyOptional({ description: 'Updated content text of the post', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  content?: string;

  @ApiPropertyOptional({ description: 'Updated image URL for the post' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
