import { IsNotEmpty, IsOptional, IsNumber, IsString, IsBoolean } from 'class-validator';
import { Expose, Type, Transform } from 'class-transformer';
import { User } from 'src/modules/user/entities/user.entity';

export class CreateCustomer2ProductDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  product: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  customer: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  /**
   * Alınan Tutar - Müşteriden alınan ön ödeme veya kısmi ödeme tutarı
   */
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  paidAmount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  offer?: number;

  /**
   * Ödeme tamamlandı mı?
   * true: Tüm ödeme alındı (paidAmount >= offer)
   * false: Kısmi ödeme veya ödeme alınmadı
   */
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isPayCompleted?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Expose()
  user?: User;
}