import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// Column mapping for import
export class ColumnMappingDto {
  @IsString()
  excelColumn: string;

  @IsString()
  @IsOptional()
  targetField?: string;

  @IsBoolean()
  @IsOptional()
  skip?: boolean;
}

// Import request DTO
export class ImportExcelDto {
  @IsString()
  kisilerFileId: string;

  @IsString()
  @IsOptional()
  notlarFileId?: string;

  @IsArray()
  @IsOptional()
  @Type(() => ColumnMappingDto)
  columnMappings?: ColumnMappingDto[];

  @IsBoolean()
  @IsOptional()
  skipDuplicates?: boolean;

  @IsBoolean()
  @IsOptional()
  updateExisting?: boolean;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  fieldsToUpdate?: string[];
}

// Analyze request DTO
export class AnalyzeExcelDto {
  @IsString()
  fileId: string;
}

// Column analysis response
export class ColumnAnalysisDto {
  name: string;
  sampleValues: string[];
  suggestedMapping: string | null;
  dataType: 'string' | 'number' | 'date' | 'email' | 'phone';
  emptyCount: number;
  uniqueCount: number;
  totalCount: number;
}

// Validation results
export class ValidationResultsDto {
  errors: string[];
  warnings: string[];
  duplicatePhones: number;
  duplicateEmails: number;
  missingRequiredFields: number;
  existingPhonesInDb: number;
  existingEmailsInDb: number;
}

// Analysis result response
export class AnalysisResultDto {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columns: ColumnAnalysisDto[];
  estimatedImportTime: number; // in seconds
  validationResults: ValidationResultsDto;
}

// Import progress response
export class ImportProgressDto {
  status: 'pending' | 'analyzing' | 'importing' | 'completed' | 'failed';
  progress: number; // 0-100
  currentStep: string;
  processedRows: number;
  totalRows: number;
  errors: string[];
  createdCustomers: number;
  updatedCustomers: number;
  createdNotes: number;
  skippedCount: number;
  skippedReasons: {
    noPhoneOrEmail: number;
    duplicatePhone: number;
    duplicateEmail: number;
  };
}

// Upload response
export class UploadResultDto {
  success: boolean;
  fileId: string;
  fileName: string;
  fileSize: number;
  filePath: string;
}

// Import start response
export class ImportStartResultDto {
  success: boolean;
  jobId: string;
  message: string;
}
