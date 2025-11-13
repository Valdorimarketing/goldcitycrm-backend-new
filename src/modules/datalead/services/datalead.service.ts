import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../../customer/entities/customer.entity';
import { CreateDataleadCustomerDto } from '../dto/create-datalead-customer.dto';

@Injectable()
export class DataleadService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) { }


  async createCustomerFromDatalead(dto: CreateDataleadCustomerDto) {
    // Telefon veya e-posta boşsa kayıt engelle
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('At least one of phone or email is required.');
    }

    function extractCheckupPackage(html: string): string {
      const match = html.match(/<span class="frm_text_label_for_image_inner">(.*?)<\/span>/)
      return match ? match[1] : html
    }

    const existing = await this.customerRepository.findOne({
      where: [{ phone: dto.phone }, { email: dto.email }],
    });

    if (existing) {
      throw new BadRequestException('Customer already exists.');
    }

    const checkupPackageText = extractCheckupPackage(dto.checkup_package) || '-';

    const newCustomer = this.customerRepository.create({
      name: dto.name,
      surname: dto.surname,
      email: dto.email,
      phone: dto.phone,
      url: dto.url,
      checkup_package: checkupPackageText,
      isActive: true,
      status: 1,
      sourceId: dto.sourceId,
    });

    const response = this.customerRepository.save(newCustomer);
    if (response) {
      return "ok";
    }

    return "error";
  }


}
